import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/sharedQueueVisibility.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const { mergePendingQueuedMessages, visibleQueuedMessages } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('optimistic removal stays hidden through stale server snapshots and rolls back if needed', () => {
  const queue = [{ id: 'first' }, { id: 'second' }]
  const pending = new Set(['first'])

  assert.deepEqual(visibleQueuedMessages(queue, pending), [{ id: 'second' }])
  assert.deepEqual(queue, [{ id: 'first' }, { id: 'second' }])
  pending.delete('first')
  assert.equal(visibleQueuedMessages(queue, pending), queue)
})

test('only waiting and uncertain deliveries count as queued on every device', () => {
  const queue = [
    { id: 'direct', deliveryState: 'submitting' },
    { id: 'starting', deliveryState: 'sending', sendAttempt: { at: 'now' } },
    { id: 'waiting', deliveryState: 'pending' },
    { id: 'unknown', deliveryState: 'unverified', sendAttempt: { at: 'earlier' } },
    { id: 'legacy' },
  ]
  assert.deepEqual(visibleQueuedMessages(queue).map(({ id }) => id), ['waiting', 'unknown', 'legacy'])
  assert.deepEqual(visibleQueuedMessages(queue, new Set(['waiting'])).map(({ id }) => id), ['unknown', 'legacy'])
})

test('an unconfirmed send becomes visible for review, not silently retried', () => {
  assert.deepEqual(visibleQueuedMessages([{ id: 'message', deliveryState: 'sending' }]), [])
  const unknown = [{ id: 'message', deliveryState: 'unverified', sendAttempt: { at: 'now' } }]
  assert.deepEqual(visibleQueuedMessages(unknown), unknown)
})

test('a pending local submission appears immediately and merges into its server queue position', () => {
  const first = { id: 'first', deliveryState: 'pending' }
  const submitting = { id: 'second', deliveryState: 'submitting' }
  assert.deepEqual(mergePendingQueuedMessages([first], [submitting]), [first, submitting])
  assert.deepEqual(mergePendingQueuedMessages([first, { id: 'second', deliveryState: 'pending' }], [submitting]), [first, submitting])
  assert.deepEqual(mergePendingQueuedMessages([first, { id: 'second', deliveryState: 'pending' }], []), [first, { id: 'second', deliveryState: 'pending' }])
})

test('an authoritative unverified delivery takes priority over a local submitting preview', () => {
  const submitting = { id: 'message', deliveryState: 'submitting' }
  const unverified = { id: 'message', deliveryState: 'unverified', sendAttempt: { at: 'now' } }
  assert.deepEqual(mergePendingQueuedMessages([unverified], [submitting]), [unverified])
})
