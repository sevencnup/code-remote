import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/queueRecovery.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const {
  restoreQueueRecoveryBarriers,
  reconcileQueueRecoveryBarrier,
  completionReleasesQueueBarrier,
  canAutomaticallyAdvanceQueue,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('legacy persisted queues require authoritative recovery validation', () => {
  assert.deepEqual(restoreQueueRecoveryBarriers({}, ['thread-old']), {
    'thread-old': { turnId: null, status: 'unverified' },
  })
})

test('a running turn keeps the queue blocked and remembers its turn ID', () => {
  const barrier = reconcileQueueRecoveryBarrier(undefined, {
    running: true,
    hasTurn: true,
    turnId: 'turn-active',
    status: 'inProgress',
  }, true)
  assert.deepEqual(barrier, { turnId: 'turn-active', status: 'running' })
  assert.equal(canAutomaticallyAdvanceQueue(barrier, null), false)
})

test('only authoritative normal completion clears a recovery barrier', () => {
  assert.equal(reconcileQueueRecoveryBarrier(
    { turnId: 'turn-1', status: 'running' },
    { running: false, hasTurn: true, turnId: 'turn-1', status: 'completed' },
    true,
  ), null)
  assert.deepEqual(reconcileQueueRecoveryBarrier(
    { turnId: 'turn-1', status: 'running' },
    { running: false, hasTurn: true, turnId: 'turn-1', status: 'interrupted' },
    true,
  ), { turnId: 'turn-1', status: 'interrupted' })
  assert.deepEqual(reconcileQueueRecoveryBarrier(
    { turnId: 'turn-1', status: 'running' },
    { running: false, hasTurn: true, turnId: 'turn-2', status: 'completed' },
    true,
  ), { turnId: 'turn-1', status: 'interrupted' })
})

test('completion notifications must match the persisted turn and finish normally', () => {
  const barrier = { turnId: 'turn-1', status: 'running' }
  assert.equal(completionReleasesQueueBarrier(barrier, 'turn-1', true), true)
  assert.equal(completionReleasesQueueBarrier(barrier, 'turn-old', true), false)
  assert.equal(completionReleasesQueueBarrier(barrier, 'turn-1', false), false)
  assert.equal(completionReleasesQueueBarrier({ turnId: null, status: 'unverified' }, 'turn-1', true), false)
})

test('automatic queue advance requires both an idle turn and no recovery barrier', () => {
  assert.equal(canAutomaticallyAdvanceQueue(undefined, null), true)
  assert.equal(canAutomaticallyAdvanceQueue(undefined, 'turn-active'), false)
  assert.equal(canAutomaticallyAdvanceQueue({ turnId: null, status: 'unverified' }, null), false)
})
