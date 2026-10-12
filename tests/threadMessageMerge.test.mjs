import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/threadMessageMerge.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { preserveLocalQueuedMessages, reconcileDeliveredLocalMessage } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

function userMessage(id, turnId, text, extra = {}) {
  return { id, role: 'user', turnId, text, createdAt: '2026-10-12T15:00:00.000Z', ...extra }
}

test('does not duplicate the first optimistic message after history sync without a prior anchor', () => {
  const image = { name: 'screenshot.png', previewUrl: 'data:image/png;base64,abc123' }
  const local = userMessage('queued-local', 'turn-first', '检查这个页面', { images: [image] })
  const historical = userMessage('server-message', 'turn-first', '检查这个页面', { images: [image] })

  assert.deepEqual(preserveLocalQueuedMessages([historical], [local]), [historical])
})

test('does not merge identical text from different turns', () => {
  const earlier = userMessage('server-earlier', 'turn-earlier', '再检查一次')
  const local = userMessage('queued-local', 'turn-current', '再检查一次')

  assert.deepEqual(preserveLocalQueuedMessages([earlier], [local]), [earlier, local])
})

test('keeps an optimistic message when it has not arrived in history yet', () => {
  const anchor = userMessage('server-anchor', 'turn-anchor', '上一条')
  const local = userMessage('queued-local', 'turn-current', '正在发送')

  assert.deepEqual(preserveLocalQueuedMessages([anchor], [anchor, local]), [anchor, local])
})

test('deduplicates a matching message after an existing history anchor', () => {
  const anchor = userMessage('server-anchor', 'turn-anchor', '上一条')
  const local = userMessage('queued-local', 'turn-current', '同一条')
  const historical = userMessage('server-current', 'turn-current', '同一条')

  assert.deepEqual(preserveLocalQueuedMessages([anchor, historical], [anchor, local]), [anchor, historical])
})

test('reconciles the optimistic message when history arrives before its delivery turn ID', () => {
  const local = userMessage('queued-request-1', undefined, '请检查这个文件')
  const historical = userMessage('server-message-1', 'turn-1', '请检查这个文件')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([local, historical], local.id, 'turn-1', new Set()),
    [historical],
  )
})

test('keeps an earlier identical message when its ID existed before this send', () => {
  const earlier = userMessage('server-message-earlier', 'turn-1', '再检查一次')
  const local = userMessage('queued-request-2', undefined, '再检查一次')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([earlier, local], local.id, 'turn-1', new Set([earlier.id])),
    [earlier, { ...local, turnId: 'turn-1' }],
  )
})

test('attaches a delivery turn ID while the matching history item is still unavailable', () => {
  const local = userMessage('queued-request-3', undefined, '正在发送')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([local], local.id, 'turn-2', new Set()),
    [{ ...local, turnId: 'turn-2' }],
  )
})
