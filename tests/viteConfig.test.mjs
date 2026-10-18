import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { loadConfigFromFile } from 'vite'

test('Vite does not watch Codex Remote runtime state', async () => {
  const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url))
  const loaded = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    configFile,
  )

  assert.ok(loaded)
  const ignored = loaded.config.server?.watch?.ignored
  assert.ok(
    Array.isArray(ignored) && ignored.includes('**/.codex-remote/**'),
    'Vite must ignore .codex-remote so Windows pairing state writes cannot deadlock the backend',
  )
})
