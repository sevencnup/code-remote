import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
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

test('Vite publishes the voice capture worklet from the public directory', async () => {
  const configFile = fileURLToPath(new URL('../vite.config.ts', import.meta.url))
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    configFile,
  )

  assert.ok(loaded)
  assert.equal(loaded.config.publicDir, 'public')
  assert.ok(existsSync(fileURLToPath(new URL('../public/pcm16-capture-worklet.js', import.meta.url))))
})
