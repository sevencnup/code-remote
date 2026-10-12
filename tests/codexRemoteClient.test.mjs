import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/codexRemoteClient.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const testModule = `${outputText}\n//# sourceURL=codexRemoteClient.ts`
const { codexRemoteClient, messagesFromThread, RemoteApiError, threadContainsNewPayload } = await import(`data:text/javascript;base64,${Buffer.from(testModule).toString('base64')}`)
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

test('restores message send time, reply start time, and completed turn duration', () => {
  const sentAt = '2026-10-12T10:15:20.000Z'
  const startedAt = '2026-10-12T10:15:22.000Z'
  const completedAt = '2026-10-12T10:15:27.500Z'
  const messages = messagesFromThread({ id: 'thread-one', turns: [{
    id: 'turn-one',
    startedAt,
    completedAt,
    items: [
      { id: 'user-one', type: 'userMessage', createdAt: sentAt, content: [{ type: 'text', text: '开始' }] },
      { id: 'assistant-one', type: 'agentMessage', text: '完成' },
    ],
  }] })

  assert.equal(messages[0].sentAt, sentAt)
  assert.equal(messages[1].replyStartedAt, startedAt)
  assert.equal(messages[1].replyDurationMs, 5500)
})

test('renders recent Codex history event messages as visible chat bubbles', () => {
  const messages = messagesFromThread({ id: 'thread-one', turns: [{
    id: 'turn-one',
    startedAt: '2026-10-12T02:36:43Z',
    completedAt: '2026-10-12T02:37:00Z',
    items: [
      { id: 'user-one', type: 'userMessage', createdAt: '2026-10-12T02:36:43Z', content: [{ type: 'text', text: '读取不到聊天' }] },
      { id: 'assistant-one', type: 'agentMessage', createdAt: '2026-10-12T02:36:53Z', text: '正在检查历史解析。' },
    ],
  }] })

  assert.deepEqual(messages.map(({ role, text, turnId }) => ({ role, text, turnId })), [
    { role: 'user', text: '读取不到聊天', turnId: 'turn-one' },
    { role: 'assistant', text: '正在检查历史解析。', turnId: 'turn-one' },
  ])
})

test('uses turn start as the best available historical user send time', () => {
  const startedAt = '2026-10-12T10:15:22.000Z'
  const [message] = messagesFromThread({
    id: 'thread-one',
    turns: [{ id: 'turn-one', startedAt, items: [{
      id: 'user-one',
      type: 'userMessage',
      content: [{ type: 'text', text: '继续' }],
    }] }],
  })

  assert.equal(message.sentAt, startedAt)
})

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

test('restores original PDF attachments from history without exposing the temporary path', () => {
  const attachmentId = 'Ab'.repeat(16)
  const marker = `[[CODEX_REMOTE_PDF_BEGIN id=${attachmentId} name=INVOICE%203522.pdf]]\n原始文件路径：\`/tmp/private/${attachmentId}.pdf\`\n请使用本机工具读取原件。\n[[CODEX_REMOTE_PDF_END id=${attachmentId}]]`
  const [message] = messagesFromThread({ id: 'thread-one', turns: [userTurn('turn-one', 'message-one', `DUE DATE 右边是什么？\n\n${marker}`)] })

  assert.equal(message.text, 'DUE DATE 右边是什么？')
  assert.deepEqual(message.documents, [{ name: 'INVOICE 3522.pdf', content: '', sourceFileId: attachmentId, charCount: 0 }])
  assert.doesNotMatch(message.text, /\/tmp\/private/)
  const thread = { id: 'thread-one', turns: [
    userTurn('known-turn', 'known-message', '上一条消息'),
    userTurn('turn-one', 'message-one', `DUE DATE 右边是什么？\n\n${marker}`),
  ] }
  assert.equal(threadContainsNewPayload(thread, new Set(['known-message']), new Set(['known-turn']), {
    requestText: 'DUE DATE 右边是什么？', images: [], documents: [{ name: 'INVOICE 3522.pdf', content: '', sourceFileId: attachmentId }],
  }), true)
})

test('sends PDF attachment IDs without embedding PDF contents into the turn request', async () => {
  respondWith(jsonResponse({ turn_id: 'turn-one' }))
  const attachmentId = 'Cd'.repeat(16)

  await codexRemoteClient.startTurn('test-token', 'thread-one', {
    ...turnInput,
    prompt: 'DUE DATE 右边是什么？',
    documents: [{ name: 'invoice.pdf', content: '', sourceFileId: attachmentId }],
  })

  const body = JSON.parse(attempts[0].init.body)
  assert.deepEqual(body.pdf_attachments, [attachmentId])
  assert.equal(body.prompt, 'DUE DATE 右边是什么？')
  assert.equal(JSON.stringify(body).includes('%PDF-'), false)
})

test('renames a thread through the authenticated thread-name API', async () => {
  respondWith(jsonResponse({ thread_id: 'thread-one', name: '项目讨论' }))

  const result = await codexRemoteClient.renameThread('test-token', 'thread/one', '项目讨论')

  assert.deepEqual(result, { thread_id: 'thread-one', name: '项目讨论' })
  assert.equal(attempts[0].path, '/api/v1/codex/threads/thread%2Fone/name')
  assert.equal(attempts[0].init.method, 'POST')
  assert.equal(attempts[0].init.headers.Authorization, 'Bearer test-token')
  assert.deepEqual(JSON.parse(attempts[0].init.body), { name: '项目讨论' })
})
