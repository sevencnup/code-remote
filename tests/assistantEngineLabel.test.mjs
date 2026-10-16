import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const pageSource = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')

test('assistant messages use the active pane engine name', () => {
  assert.match(pageSource, /assistantName=\{activeEngineLabel\}/)
  assert.match(pageSource, /const activeEngineLabel = remote\.activeEngine === 'claude-code' \? 'Claude Code' : 'Codex'/)
  assert.match(pageSource, /assistantName: string/)
  assert.match(pageSource, /<strong>\{assistantName\}<\/strong>/)
  assert.doesNotMatch(pageSource, /message\.role === 'assistant' \? <strong>Codex<\/strong>/)
})
