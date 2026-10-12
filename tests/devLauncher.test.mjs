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

test('Windows launcher prefers the managed daemon CLI before PATH and VS Code fallbacks', async () => {
  const launcher = fileURLToPath(new URL('../scripts/dev.mjs', import.meta.url))
  const source = await readFile(launcher, 'utf8')

  const managedDaemon = source.indexOf('managedDaemonCodex,')
  const pathCandidates = source.indexOf('...pathCodexCandidates')
  const vscodeCandidates = source.indexOf('...vscodeCodexCandidates')

  assert.notEqual(managedDaemon, -1, 'the launcher must inspect the managed daemon CLI')
  assert.notEqual(pathCandidates, -1, 'the launcher must inspect Codex executables on PATH')
  assert.notEqual(vscodeCandidates, -1, 'the launcher must keep the VS Code fallback')
  assert.ok(managedDaemon < pathCandidates, 'the managed daemon CLI must be preferred over PATH wrappers')
  assert.ok(pathCandidates < vscodeCandidates, 'the PATH CLI must be preferred over the VS Code fallback')
})

test('one-click batch launchers delegate Codex CLI selection to the shared launcher', async () => {
  for (const relativePath of ['../start-codex-remote.bat', '../启动 Codex Remote.bat']) {
    const launcher = fileURLToPath(new URL(relativePath, import.meta.url))
    const source = await readFile(launcher, 'utf8')

    assert.doesNotMatch(
      source,
      /set "CODEX_REMOTE_COMMAND=/,
      `${relativePath} must not pin a bundled or stale Codex CLI`,
    )
  }
})
