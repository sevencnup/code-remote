import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function importTypeScript(path, names) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const loaded = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
  return Object.fromEntries(names.map((name) => [name, loaded[name]]))
}

const {
  retainThreadHistoryCacheRecords,
  threadHistoryCacheMaxBytes,
  threadHistoryCacheMaxEntries,
  readThreadHistoryCache,
  writeThreadHistoryCache,
  serializedCacheSizeBytes,
} = await importTypeScript('../src/lib/threadHistoryStorage.ts', [
  'retainThreadHistoryCacheRecords',
  'threadHistoryCacheMaxBytes',
  'threadHistoryCacheMaxEntries',
  'readThreadHistoryCache',
  'writeThreadHistoryCache',
  'serializedCacheSizeBytes',
])
const { canUseCachedThreadHistory, threadHistoryVersionChanged } = await importTypeScript('../src/lib/threadHistoryPolicy.ts', ['canUseCachedThreadHistory', 'threadHistoryVersionChanged'])

test('content revisions detect same-second changes without reloading for inconsistent previews', () => {
  const cached = { complete: true, running: false, updatedAt: 100, historyRevision: '100:200', preview: 'last message' }
  const latest = { updatedAt: 100, historyRevision: '100:200', preview: 'first message' }
  assert.equal(threadHistoryVersionChanged(cached, latest), false)
  assert.equal(canUseCachedThreadHistory(cached, latest, true, false), true)
  assert.equal(threadHistoryVersionChanged(cached, { ...latest, historyRevision: '100:250' }), true)
  assert.equal(canUseCachedThreadHistory(cached, { ...latest, historyRevision: '100:250' }, true, false), false)
  assert.equal(threadHistoryVersionChanged({ updatedAt: 100, preview: 'last' }, { updatedAt: 100, preview: 'first' }), false)
})

test('an older persisted cache must acquire a server revision before it can be reused', () => {
  const cached = { complete: true, running: false, updatedAt: 100 }
  const latest = { updatedAt: 100, historyRevision: '100:200' }
  assert.equal(threadHistoryVersionChanged(cached, latest), true)
  assert.equal(canUseCachedThreadHistory(cached, latest, true, false), false)
})

test('keeps only the five most recently used histories within the byte budget', () => {
  const records = Array.from({ length: 7 }, (_, index) => ({
    threadId: `thread-${index}`,
    lastAccessedAt: index,
    sizeBytes: 10,
    snapshot: {},
  }))
  const { retained, evicted } = retainThreadHistoryCacheRecords(records)

  assert.equal(retained.length, threadHistoryCacheMaxEntries)
  assert.deepEqual(retained.map((record) => record.threadId), ['thread-6', 'thread-5', 'thread-4', 'thread-3', 'thread-2'])
  assert.deepEqual(evicted.map((record) => record.threadId), ['thread-1', 'thread-0'])
})

test('evicts least recently used records when the total byte budget is exceeded', () => {
  const records = [
    { threadId: 'old', lastAccessedAt: 1, sizeBytes: threadHistoryCacheMaxBytes * 0.6, snapshot: {} },
    { threadId: 'new', lastAccessedAt: 2, sizeBytes: threadHistoryCacheMaxBytes * 0.6, snapshot: {} },
  ]
  const { retained, evicted } = retainThreadHistoryCacheRecords(records)
  assert.deepEqual(retained.map((record) => record.threadId), ['new'])
  assert.deepEqual(evicted.map((record) => record.threadId), ['old'])
})

test('only trusts complete, idle cache entries matching current server metadata and no pending queue', () => {
  const cached = { complete: true, running: false, updatedAt: '2026-10-12T10:00:00Z' }
  const current = { updatedAt: '2026-10-12T10:00:00Z', status: { type: 'idle' } }

  assert.equal(canUseCachedThreadHistory(cached, current, true, false), true)
  assert.equal(canUseCachedThreadHistory(cached, { ...current, updatedAt: '2026-10-12T10:00:01Z' }, true, false), false)
  assert.equal(canUseCachedThreadHistory({ ...cached, complete: false }, current, true, false), false)
  assert.equal(canUseCachedThreadHistory(cached, { ...current, status: { type: 'inProgress' } }, true, false), false)
  assert.equal(canUseCachedThreadHistory(cached, current, false, false), false)
  assert.equal(canUseCachedThreadHistory(cached, current, true, true), false)
})

test('IndexedDB failure degrades to cache miss without breaking callers', async () => {
  const original = globalThis.indexedDB
  try {
    globalThis.indexedDB = undefined
    assert.equal(await readThreadHistoryCache('thread-unavailable'), null)
    assert.equal(await writeThreadHistoryCache('thread-unavailable', {}, 2), false)
  } finally {
    if (original === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = original
  }
})

test('serialized cache size is measured and non-serializable data is rejected', () => {
  assert.equal(serializedCacheSizeBytes({ text: 'abc' }), new TextEncoder().encode('{"text":"abc"}').byteLength)
  const circular = {}
  circular.self = circular
  assert.equal(serializedCacheSizeBytes(circular), 0)
})
