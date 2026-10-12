import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/turnTiming.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { eventTimestamp, latestTurnState, resolveTurnStartedAt } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

test('restores a running turn and its server start timestamp from history', () => {
  assert.deepEqual(latestTurnState({ turns: [
    { id: 'turn-old', status: 'completed', startedAt: '2026-10-11T10:00:00Z' },
    { id: 'turn-current', status: 'inProgress', startedAt: '2026-10-12T10:15:30Z' },
  ] }), {
    running: true,
    hasTurn: true,
    turnId: 'turn-current',
    startedAt: Date.parse('2026-10-12T10:15:30Z'),
  })
})

test('keeps a per-turn fallback stable and prefers an authoritative server time', () => {
  assert.equal(resolveTurnStartedAt(null, 1_800_000_000_000, 1_900_000_000_000), 1_800_000_000_000)
  assert.equal(resolveTurnStartedAt(1_700_000_000_000, 1_800_000_000_000), 1_700_000_000_000)
  assert.equal(eventTimestamp(1_800_000_000), 1_800_000_000_000)
  assert.equal(eventTimestamp('not-a-time'), null)
})
