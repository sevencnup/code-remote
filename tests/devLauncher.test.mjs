import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('Windows launcher preserves an explicitly configured isolated Codex runtime', async () => {
  const launcher = fileURLToPath(new URL('../scripts/dev.mjs', import.meta.url))
  const source = await readFile(launcher, 'utf8')

  assert.match(
    source,
    /'CODEX_REMOTE_APP_SERVER_HOME'/,
    'cleanCodexEnvironment must not discard the isolated app-server home override',
  )
})
