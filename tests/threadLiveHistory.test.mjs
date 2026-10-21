import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/threadLiveHistory.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { ThreadLiveHistory } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('a snapshot from before turn/started cannot stop the new reply', () => {
  const state = new ThreadLiveHistory()
  state.start('chat', 'new')
  assert.equal(state.reconcile({ id: 'chat', turns: [{ id: 'old', status: 'completed' }] }), null)
  const current = { id: 'chat', turns: [{ id: 'new', status: 'inProgress' }] }
  assert.equal(state.reconcile(current), current)
})

test('a delayed running snapshot cannot resurrect a completed or interrupted turn', () => {
  for (const status of ['completed', 'interrupted', 'failed']) {
    const state = new ThreadLiveHistory()
    state.start('chat', 'turn')
    state.finish('chat', 'turn', status, 123)
    const snapshot = { id: 'chat', status: { type: 'active' }, turns: [{ id: 'turn', status: 'inProgress', items: [{ id: 'answer' }] }] }
    const result = state.reconcile(snapshot)
    assert.equal(result.turns[0].status, status)
    assert.equal(result.status.type, status)
    assert.equal(result.turns[0].completedAt, 123)
    assert.deepEqual(result.turns[0].items, [{ id: 'answer' }])
    assert.equal(snapshot.turns[0].status, 'inProgress')
    assert.equal(state.start('chat', 'turn'), false)
  }
})

test('fresh history closes a missed completion and rejects late streaming events', () => {
  const state = new ThreadLiveHistory()
  state.start('chat', 'turn')
  state.reconcile({ id: 'chat', turns: [{ id: 'turn', status: 'completed' }] })
  assert.equal(state.isFinished('chat', 'turn'), true)
  assert.equal(state.isFinished('other-chat', 'turn'), false)
  assert.equal(state.isFinished('chat', 'next-turn'), false)
})

test('previous turn completion cannot cancel a later running turn', () => {
  const state = new ThreadLiveHistory()
  state.start('chat', 'next')
  state.finish('chat', 'old')
  assert.equal(state.reconcile({ id: 'chat', turns: [{ id: 'old', status: 'completed' }] }), null)
  const result = state.reconcile({ id: 'chat', turns: [{ id: 'old', status: 'inProgress' }, { id: 'next', status: 'inProgress' }] })
  assert.equal(result.turns[0].status, 'completed')
  assert.equal(result.turns[1].status, 'inProgress')
  assert.equal(result.status.type, 'inProgress')
})
