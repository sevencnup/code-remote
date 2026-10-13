import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/messageWindow.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const {
  messageWindowBatchSize,
  recentMessageWindow,
  visibleMessageStart,
  earlierMessageWindow,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('a long thread initially shows only its recent messages', () => {
  const window = recentMessageWindow('thread-a', 320)
  assert.equal(window.start, 320 - messageWindowBatchSize)
  assert.equal(visibleMessageStart(window, 'thread-a', 321), 321 - messageWindowBatchSize)
  assert.equal(window.anchoredToLatest, true)
  assert.equal(visibleMessageStart(recentMessageWindow('thread-a', 0), 'thread-a', 320), 320 - messageWindowBatchSize)
})

test('older messages load in batches without skipping or losing the latest tail', () => {
  let window = recentMessageWindow('thread-a', 250)
  window = earlierMessageWindow(window, 'thread-a', 250)
  assert.equal(window.start, 90)
  window = earlierMessageWindow(window, 'thread-a', 250)
  assert.equal(window.start, 10)
  window = earlierMessageWindow(window, 'thread-a', 250)
  assert.equal(window.start, 0)
  assert.equal(window.anchoredToLatest, false)
  assert.equal(visibleMessageStart(window, 'thread-a', 251), 0)
  assert.equal(visibleMessageStart(window, 'thread-a', 330), 0)
})

test('switching threads or replacing a shorter history resets to that thread’s tail', () => {
  const old = { threadId: 'thread-a', start: 60, anchoredToLatest: false }
  assert.equal(visibleMessageStart(old, 'thread-b', 400), 320)
  assert.equal(visibleMessageStart(old, 'thread-a', 40), 0)
  assert.deepEqual(earlierMessageWindow(old, 'thread-b', 400), { threadId: 'thread-b', start: 240, anchoredToLatest: false })
})
