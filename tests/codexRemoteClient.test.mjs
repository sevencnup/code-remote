import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/codexRemoteClient.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const testModule = `${outputText}\n//# sourceURL=codexRemoteClient.ts`
const { codexRemoteClient, RemoteApiError, threadContainsNewPayload } = await import(`data:text/javascript;base64,${Buffer.from(testModule).toString('base64')}`)
const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
let attempts
let delays

beforeEach(() => {
  attempts = []
  delays = []
  globalThis.window = {
    setTimeout(callback, delay) {
      delays.push(delay)
      queueMicrotask(callback)
      return delays.length
    },
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

function respondWith(...responses) {
  globalThis.fetch = async (path, init) => {
    attempts.push({ path, init })
    const response = responses[Math.min(attempts.length - 1, responses.length - 1)]
    if (response instanceof Error) throw response
    return response
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function interruptedBody() {
  return new Response(new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"turn_id":'))
      controller.error(new TypeError('Load failed while reading response body'))
    },
  }), { headers: { 'Content-Type': 'application/json' } })
}

const turnInput = { prompt: '继续', images: [], requestId: 'queued-regression-001' }

test('retries a send whose headers arrived but whose response body was interrupted', async () => {
  respondWith(interruptedBody(), jsonResponse({ turn_id: 'turn-one' }))

  assert.deepEqual(await codexRemoteClient.startTurn('test-token', 'thread-one', turnInput), { turn_id: 'turn-one' })
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0].init.body, attempts[1].init.body)
  assert.equal(JSON.parse(attempts[1].init.body).request_id, turnInput.requestId)
  assert.deepEqual(delays, [300])
})

test('retries history reads when their response body is interrupted', async () => {
  respondWith(interruptedBody(), jsonResponse({ id: 'thread-one', turns: [] }))

  assert.equal((await codexRemoteClient.readThread('test-token', 'thread-one')).id, 'thread-one')
  assert.equal(attempts.length, 2)
})

test('retries a truncated JSON response with the same send request ID', async () => {
  respondWith(new Response('{"turn_id":'), jsonResponse({ turn_id: 'turn-one' }))

  assert.equal((await codexRemoteClient.startTurn('test-token', 'thread-one', turnInput)).turn_id, 'turn-one')
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0].init.body, attempts[1].init.body)
})

test('retries temporary gateway failures with the same send request ID', async () => {
  respondWith(jsonResponse({}, 502), jsonResponse({}, 504), jsonResponse({ turn_id: 'turn-one' }))

  assert.equal((await codexRemoteClient.startTurn('test-token', 'thread-one', turnInput)).turn_id, 'turn-one')
  assert.equal(attempts.length, 3)
  assert.ok(attempts.every(({ init }) => init.body === attempts[0].init.body))
  assert.deepEqual(delays, [300, 900])
})

test('stops after bounded network retries', async () => {
  respondWith(new TypeError('Failed to fetch'))

  await assert.rejects(codexRemoteClient.startTurn('test-token', 'thread-one', turnInput), /Failed to fetch/)
  assert.equal(attempts.length, 4)
  assert.deepEqual(delays, [300, 900, 1800])
})

test('preserves authentication and business rejections without retrying', async () => {
  for (const status of [401, 409, 422, 503]) {
    attempts = []
    delays = []
    respondWith(jsonResponse({ detail: '请求已被拒绝' }, status))

    await assert.rejects(codexRemoteClient.startTurn('test-token', 'thread-one', turnInput), (error) =>
      error instanceof RemoteApiError && error.status === status && error.message === '请求已被拒绝',
    )
    assert.equal(attempts.length, 1)
    assert.deepEqual(delays, [])
  }
})

test('does not retry mutations without a request ID when a gateway fails', async () => {
  respondWith(jsonResponse({}, 502))

  await assert.rejects(codexRemoteClient.handoffToLocalCodex('test-token'), (error) => error.status === 502)
  assert.equal(attempts.length, 1)
  assert.deepEqual(delays, [])
})

test('pairing has a bounded timeout and reports it clearly', async () => {
  respondWith(new DOMException('The operation timed out', 'TimeoutError'))

  await assert.rejects(
    codexRemoteClient.pair('ABCDEFGH'),
    /连接超时，请确认 Codex Remote 服务正在运行后重试。/,
  )
  assert.equal(attempts.length, 1)
  assert.ok(attempts[0].init.signal instanceof AbortSignal)
})

test('requests a compact resume response instead of downloading old history to send', async () => {
  respondWith(jsonResponse({ id: 'thread-one' }))

  await codexRemoteClient.resumeThread('test-token', 'thread-one', turnInput.requestId)
  assert.deepEqual(JSON.parse(attempts[0].init.body), {
    request_id: turnInput.requestId,
    include_history: false,
  })
})

function userTurn(turnId, messageId, text) {
  return { id: turnId, items: [{ id: messageId, type: 'userMessage', content: [{ type: 'text', text }] }] }
}

test('does not mistake an older repeated prompt omitted from the cache for a delivered message', () => {
  const thread = { id: 'thread-one', turns: [
    userTurn('older-turn', 'older-message', '继续'),
    userTurn('known-turn', 'known-message', '另一条消息'),
  ] }

  assert.equal(threadContainsNewPayload(thread, new Set(['known-message']), new Set(['known-turn']), {
    requestText: '继续', images: [],
  }), false)
})

test('confirms a matching message only after the latest known turn', () => {
  const thread = { id: 'thread-one', turns: [
    userTurn('older-turn', 'older-message', '继续'),
    userTurn('known-turn', 'known-message', '另一条消息'),
    userTurn('new-turn', 'new-message', '继续'),
  ] }

  assert.equal(threadContainsNewPayload(thread, new Set(['known-message']), new Set(['known-turn']), {
    requestText: '继续', images: [],
  }), true)
})

test('cannot confirm a send from old history when no message or turn baseline is available', () => {
  const thread = { id: 'thread-one', turns: [userTurn('older-turn', 'older-message', '继续')] }

  assert.equal(threadContainsNewPayload(thread, new Set(), new Set(), { requestText: '继续', images: [] }), false)
})
