import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/sharedQueueVisibility.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const { visibleQueuedMessages } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('optimistic removal stays hidden through stale server snapshots and rolls back if needed', () => {
  const queue = [{ id: 'first' }, { id: 'second' }]
  const pending = new Set(['first'])

  assert.deepEqual(visibleQueuedMessages(queue, pending), [{ id: 'second' }])
  assert.deepEqual(queue, [{ id: 'first' }, { id: 'second' }])
  pending.delete('first')
  assert.equal(visibleQueuedMessages(queue, pending), queue)
})
