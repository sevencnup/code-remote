import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/composerImageDrafts.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const originalIndexedDB = globalThis.indexedDB

function memoryIndexedDB() {
  const records = new Map()
  const stores = new Set()
  return {
    open() {
      const request = {}
      queueMicrotask(() => {
        request.result = {
          objectStoreNames: { contains: (name) => stores.has(name) },
          createObjectStore(name) { stores.add(name) },
          transaction() {
            const transaction = {}
            transaction.objectStore = () => ({
              get(scope) {
                const readRequest = {}
                queueMicrotask(() => {
                  readRequest.result = records.get(scope)
                  readRequest.onsuccess?.()
                })
                return readRequest
              },
              put(record) { records.set(record.scope, structuredClone(record)) },
              delete(scope) { records.delete(scope) },
            })
            queueMicrotask(() => transaction.oncomplete?.())
            return transaction
          },
        }
        request.onupgradeneeded?.()
        request.onsuccess?.()
      })
      return request
    },
  }
}

test('persists image drafts by scope and moves them without leaving a stale source copy', async () => {
  globalThis.indexedDB = memoryIndexedDB()
  const {
    moveComposerImageDraft,
    readComposerImageDraft,
    saveComposerImageDraft,
    subscribeToComposerImageDraft,
  } = await import(moduleUrl)
  const firstImage = { name: 'first.png', mediaType: 'image/png', data: 'Zmlyc3Q=' }
  const secondImage = { name: 'second.webp', mediaType: 'image/webp', data: 'c2Vjb25k' }

  try {
    await saveComposerImageDraft('thread:one', [firstImage])
    await saveComposerImageDraft('thread:two', [secondImage])
    assert.deepEqual(await readComposerImageDraft('thread:one'), [firstImage])
    assert.deepEqual(await readComposerImageDraft('thread:two'), [secondImage])

    let published
    const unsubscribe = subscribeToComposerImageDraft('thread:three', (images) => { published = images })
    assert.deepEqual(await moveComposerImageDraft('thread:one', 'thread:three'), [firstImage])
    unsubscribe()

    assert.deepEqual(published, [firstImage])
    assert.deepEqual(await readComposerImageDraft('thread:one'), [])
    assert.deepEqual(await readComposerImageDraft('thread:two'), [secondImage])
    assert.deepEqual(await readComposerImageDraft('thread:three'), [firstImage])
    await saveComposerImageDraft('thread:three', [])
    assert.deepEqual(await readComposerImageDraft('thread:three'), [])
  } finally {
    if (originalIndexedDB === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = originalIndexedDB
  }
})
