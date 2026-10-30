import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/assistantTextStream.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { collapseAssistantMessagesForTurn, reconcileAssistantStreamSnapshot, streamingAssistantText } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

const user = (id, text) => ({ id, role: 'user', text, turnId: 'turn', createdAt: '2026-10-29T14:09:00Z' })
const assistant = (id, text) => ({ ...user(id, text), role: 'assistant', streaming: true })

test('a delayed render cannot update an assistant bubble before the latest user answer', () => {
  const oldReply = assistant('stream-old', '请运行这段 PowerShell')
  const messages = [user('user-first', '连接服务器'), oldReply, user('user-answer', '已运行'), assistant('stream-new', 'SSH 已登录成功')]
  const next = collapseAssistantMessagesForTurn(messages, 'turn', 'stream-old', '请运行这段 PowerShell\n\n旧选择题')
  assert.deepEqual(next, messages)
})

test('new replies stay after the answer even when the old reply has identical text', () => {
  const messages = [user('user-first', '继续'), assistant('stream-old', '收到'), user('user-answer', '继续')]
  const next = collapseAssistantMessagesForTurn(messages, 'turn', 'stream-new', '收到')
  assert.deepEqual(next.map(({ role, text }) => [role, text]), [
    ['user', '继续'], ['assistant', '收到'], ['user', '继续'], ['assistant', '收到'],
  ])
})

test('a stale snapshot cannot reintroduce items retired at a user answer', () => {
  const reconciled = reconcileAssistantStreamSnapshot(
    [{ id: 'old-code', text: '旧 PowerShell 代码', complete: true }],
    new Map([['new-status', 'SSH 已登录成功']]),
    new Set(),
    new Set(['old-code']),
  )
  assert.equal(streamingAssistantText(reconciled.parts), 'SSH 已登录成功')
  assert.equal(reconciled.completed.has('old-code'), false)
})

test('joining a live reply preserves item order and never deduplicates distinct identical items', () => {
  const reconciled = reconcileAssistantStreamSnapshot(
    [{ id: 'first', text: '收到', complete: true }, { id: 'second', text: '收到', complete: true }],
    new Map([['second', '收到'], ['third', '继续处理']]),
    new Set(['second']),
    new Set(),
  )
  assert.equal(streamingAssistantText(reconciled.parts), '收到\n\n收到\n\n继续处理')
})
