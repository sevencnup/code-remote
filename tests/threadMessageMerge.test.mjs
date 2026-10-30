import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/threadMessageMerge.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { deliveredQueuedMessageIdsFromHistory, historyMissingCurrentUserMessages, insertDeliveredLocalMessage, insertRemoteUserMessage, legacyDuplicateQueuedMessageId, mightBeLegacyDuplicateQueuedMessage, preserveLocalQueuedMessages, reconcileDeliveredLocalMessage, startsNewAssistantStreamSegment } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

function userMessage(id, turnId, text, extra = {}) {
  return { id, role: 'user', turnId, text, createdAt: '2026-10-12T15:00:00.000Z', ...extra }
}

test('a socket answer splits the reply even while the local send is awaiting its HTTP receipt', () => {
  const first = userMessage('first', 'turn-live', '连接服务器')
  const oldReply = { ...first, id: 'old-reply', role: 'assistant', text: '运行 PowerShell', streaming: true }
  const beforeSend = [first, oldReply]
  const answer = userMessage('remote-user-answer', 'turn-live', '已经运行', { sourceItemId: 'answer' })
  assert.equal(startsNewAssistantStreamSegment(beforeSend, answer), true)

  const newReply = { ...oldReply, id: 'new-reply', text: 'SSH 已登录成功' }
  const visible = [...insertRemoteUserMessage(beforeSend, answer), newReply]
  const confirmed = insertDeliveredLocalMessage(visible, userMessage('queued-answer', 'turn-live', '已经运行'), new Set(['first', 'old-reply']))
  assert.deepEqual(confirmed, visible)
  assert.equal(startsNewAssistantStreamSegment(confirmed, answer), false)
})

test('an HTTP-first answer echo does not split or clear the next reply again', () => {
  const first = userMessage('first', 'turn-live', '连接服务器')
  const oldReply = { ...first, id: 'old-reply', role: 'assistant', text: '运行 PowerShell' }
  const local = userMessage('queued-answer', 'turn-live', '已经运行')
  const visible = insertDeliveredLocalMessage([first, oldReply], local, new Set(['first', 'old-reply']))
  const newReply = { ...oldReply, id: 'new-reply', text: 'SSH 已登录成功', streaming: true }
  visible.push(newReply)
  const answer = userMessage('remote-user-answer', 'turn-live', '已经运行', { sourceItemId: 'answer' })
  assert.equal(startsNewAssistantStreamSegment(visible, answer), false)
  assert.deepEqual(insertRemoteUserMessage(visible, answer), [first, oldReply, answer, newReply])
})

test('history before an in-turn answer is rejected until the canonical answer is present', () => {
  const first = userMessage('first', 'turn-live', '继续')
  const oldReply = { ...first, id: 'old-reply', role: 'assistant', text: '请运行命令' }
  const snapshot = [first, oldReply]
  const local = userMessage('queued-answer', 'turn-live', '继续')
  assert.equal(historyMissingCurrentUserMessages(snapshot, [...snapshot, local], 'turn-live'), true)
  const canonical = userMessage('canonical-answer', 'turn-live', '继续')
  assert.equal(historyMissingCurrentUserMessages([...snapshot, canonical], [...snapshot, local], 'turn-live'), false)
  const live = { ...canonical, id: 'remote-user-canonical-answer', sourceItemId: canonical.id }
  assert.equal(historyMissingCurrentUserMessages(snapshot, [...snapshot, live], 'turn-live'), true)
  assert.equal(historyMissingCurrentUserMessages([...snapshot, canonical], [...snapshot, live], 'turn-live'), false)
})

test('a repeated answer with a new item ID starts a new segment', () => {
  const first = userMessage('first', 'turn-live', '继续')
  const answer = userMessage('remote-user-next', 'turn-live', '继续', { sourceItemId: 'next' })
  assert.equal(startsNewAssistantStreamSegment([first], answer), true)
})

test('an old canonical item alias cannot swallow a later identical local answer', () => {
  const old = userMessage('remote-user-old', 'turn-live', '继续', { sourceItemId: 'old' })
  const local = userMessage('queued-new', 'turn-live', '继续')
  assert.deepEqual(insertDeliveredLocalMessage([old], local, new Set(['old'])), [old, local])
})

test('does not duplicate the first optimistic message after history sync without a prior anchor', () => {
  const image = { name: 'screenshot.png', previewUrl: 'data:image/png;base64,abc123' }
  const local = userMessage('queued-local', 'turn-first', '检查这个页面', { images: [image] })
  const historical = userMessage('server-message', 'turn-first', '检查这个页面', { images: [image] })

  assert.deepEqual(preserveLocalQueuedMessages([historical], [local]), [historical])
})

test('does not merge identical text from different turns', () => {
  const earlier = userMessage('server-earlier', 'turn-earlier', '再检查一次')
  const local = userMessage('queued-local', 'turn-current', '再检查一次')

  assert.deepEqual(preserveLocalQueuedMessages([earlier], [local]), [earlier, local])
})

test('keeps an optimistic message when it has not arrived in history yet', () => {
  const anchor = userMessage('server-anchor', 'turn-anchor', '上一条')
  const local = userMessage('queued-local', 'turn-current', '正在发送')

  assert.deepEqual(preserveLocalQueuedMessages([anchor], [anchor, local]), [anchor, local])
})

test('inserts the first live user item before an assistant reply that streamed first', () => {
  const earlier = userMessage('earlier', 'turn-earlier', '前一轮')
  const assistant = { id: 'streaming-turn-live', role: 'assistant', turnId: 'turn-live', text: '回复先到', createdAt: '2026-10-13T15:00:01.000Z', streaming: true }
  const incoming = { id: 'remote-user-item-live', sourceItemId: 'item-live', role: 'user', turnId: 'turn-live', text: '用户先发', createdAt: '2026-10-13T15:00:00.000Z' }

  const visible = insertRemoteUserMessage([earlier, assistant], incoming)
  assert.deepEqual(visible, [earlier, incoming, assistant])
  assert.deepEqual(insertRemoteUserMessage(visible, incoming), visible)
})

test('places a later live steer after the previous user and assistant messages', () => {
  const previousUser = userMessage('user-first', 'turn-live', '第一条')
  const previousAssistant = { id: 'assistant-first', role: 'assistant', turnId: 'turn-live', text: '第一段回复', createdAt: '2026-10-13T15:00:01.000Z' }
  const incoming = { id: 'remote-user-item-next', sourceItemId: 'item-next', role: 'user', turnId: 'turn-live', text: '补充一条', createdAt: '2026-10-13T15:00:02.000Z' }

  assert.deepEqual(insertRemoteUserMessage([previousUser, previousAssistant], incoming), [previousUser, previousAssistant, incoming])
})

test('preserves a live user item across a stale history read and replaces it when canonical history catches up', () => {
  const live = { id: 'remote-user-item-live', sourceItemId: 'item-live', role: 'user', turnId: 'turn-live', text: '实时消息', createdAt: '2026-10-13T15:00:00.000Z' }
  const canonical = userMessage('item-live', 'turn-live', '实时消息')

  assert.deepEqual(preserveLocalQueuedMessages([], [live]), [live])
  assert.deepEqual(preserveLocalQueuedMessages([canonical], [live]), [canonical])
})

test('deduplicates a matching message after an existing history anchor', () => {
  const anchor = userMessage('server-anchor', 'turn-anchor', '上一条')
  const local = userMessage('queued-local', 'turn-current', '同一条')
  const historical = userMessage('server-current', 'turn-current', '同一条')

  assert.deepEqual(preserveLocalQueuedMessages([anchor, historical], [anchor, local]), [anchor, historical])
})

test('reconciles the optimistic message when history arrives before its delivery turn ID', () => {
  const local = userMessage('queued-request-1', undefined, '请检查这个文件')
  const historical = userMessage('server-message-1', 'turn-1', '请检查这个文件')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([local, historical], local.id, 'turn-1', new Set()),
    [historical],
  )
})

test('keeps an earlier identical message when its ID existed before this send', () => {
  const earlier = userMessage('server-message-earlier', 'turn-1', '再检查一次')
  const local = userMessage('queued-request-2', undefined, '再检查一次')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([earlier, local], local.id, 'turn-1', new Set([earlier.id])),
    [earlier, { ...local, turnId: 'turn-1' }],
  )
})

test('attaches a delivery turn ID while the matching history item is still unavailable', () => {
  const local = userMessage('queued-request-3', undefined, '正在发送')

  assert.deepEqual(
    reconcileDeliveredLocalMessage([local], local.id, 'turn-2', new Set()),
    [{ ...local, turnId: 'turn-2' }],
  )
})

test('reconciles only an attempted queue item after the previous turn', () => {
  const older = userMessage('old', 'turn-old', '继续')
  const delivered = userMessage('delivered', 'turn-new', '继续', { sentAt: '2026-10-12T15:00:05.000Z' })
  const queued = [
    { id: 'queued-delivered', text: '继续', images: [], sendAttempt: { at: '2026-10-12T15:00:04.000Z', afterTurnId: 'turn-old' } },
    { id: 'queued-unsent', text: '继续', images: [] },
  ]

  assert.deepEqual([...deliveredQueuedMessageIdsFromHistory(queued, [older, delivered])], ['queued-delivered'])
})

test('does not match a prior identical prompt or a different attachment', () => {
  const older = userMessage('old', 'turn-old', '检查文件')
  const history = [older, userMessage('different', 'turn-new', '检查文件', {
    images: [{ name: 'other.png', previewUrl: 'data:image/png;base64,other' }],
  })]
  const queued = [{
    id: 'queued-image',
    text: '检查文件',
    images: [{ name: 'new.png', mediaType: 'image/png', data: 'new' }],
    sendAttempt: { at: '2026-10-12T15:00:04.000Z', afterTurnId: 'turn-old' },
  }]

  assert.equal(deliveredQueuedMessageIdsFromHistory(queued, history).size, 0)
})

test('matches an attempted PDF only when the original attachment ID matches', () => {
  const attached = { name: 'invoice.pdf', content: '', sourceFileId: 'pdf-attachment-source-id-123456' }
  const history = [userMessage('server-pdf', 'turn-pdf', '读一下', { documents: [attached] })]
  const queued = [{
    id: 'queued-pdf', text: '读一下', images: [], documents: [attached],
    sendAttempt: { at: '2026-10-12T14:59:59.000Z' },
  }]

  assert.deepEqual([...deliveredQueuedMessageIdsFromHistory(queued, history)], ['queued-pdf'])
  assert.equal(deliveredQueuedMessageIdsFromHistory([{ ...queued[0], documents: [{ ...attached, sourceFileId: 'another-pdf-id' }] }], history).size, 0)
})

test('one historical message confirms at most one identical queued request', () => {
  const historical = userMessage('delivered', 'turn-current', '重复', { sentAt: '2026-10-12T15:00:05.000Z' })
  const queued = ['one', 'two'].map((id) => ({
    id,
    text: '重复',
    images: [],
    sendAttempt: { at: '2026-10-12T15:00:04.000Z', inTurnId: 'turn-current' },
  }))

  assert.deepEqual([...deliveredQueuedMessageIdsFromHistory(queued, [historical])], ['one'])
})

test('live steer item replaces its optimistic local bubble', () => {
  const local = userMessage('queued-steer', 'turn-live', '在测试', { sentAt: '2026-10-14T04:14:20.000Z' })
  const incoming = {
    ...userMessage('server-steer', 'turn-live', '在测试'),
    sourceItemId: 'server-steer',
  }

  assert.deepEqual(insertRemoteUserMessage([local], incoming), [{
    ...incoming,
    sentAt: local.sentAt,
  }])
})

test('live steer item replaces only the newest matching optimistic bubble', () => {
  const older = userMessage('queued-older', 'turn-live', '重复')
  const newest = userMessage('queued-newest', 'turn-live', '重复')
  const incoming = { ...userMessage('server-newest', 'turn-live', '重复'), sourceItemId: 'server-newest' }

  assert.deepEqual(insertRemoteUserMessage([older, newest], incoming), [older, incoming])
})

test('an immediate steer matches a later user item in the same turn', () => {
  const original = userMessage('original', 'turn-current', '重复')
  const steer = userMessage('steer', 'turn-current', '重复')
  const queued = [{
    id: 'queued-steer', text: '重复', images: [],
    sendAttempt: { at: '2026-10-12T15:00:04.000Z', inTurnId: 'turn-current', afterMessageId: 'original' },
  }]

  assert.equal(deliveredQueuedMessageIdsFromHistory(queued, [original]).size, 0)
  assert.deepEqual([...deliveredQueuedMessageIdsFromHistory(queued, [original, steer])], ['queued-steer'])
})

test('repairs an existing duplicate queued by a rapid second submit', () => {
  const original = userMessage('server-original', 'turn-current', '同一份输入', {
    sentAt: '2026-10-12T15:00:00.000Z',
  })
  const duplicate = { id: 'queued-duplicate', text: '同一份输入', images: [], createdAt: '2026-10-12T15:00:00.100Z' }

  assert.equal(legacyDuplicateQueuedMessageId([duplicate], [original], [original], 'turn-current'), duplicate.id)
  assert.equal(legacyDuplicateQueuedMessageId([duplicate], [original], [], 'turn-current'), null)
  assert.equal(legacyDuplicateQueuedMessageId([duplicate], [original], [original], 'another-turn'), null)
  assert.equal(legacyDuplicateQueuedMessageId([{ ...duplicate, createdAt: '2026-10-12T15:00:01.000Z' }], [original], [original], 'turn-current'), null)
  const optimistic = { ...original, id: 'queued-original', turnId: undefined }
  assert.equal(mightBeLegacyDuplicateQueuedMessage([duplicate], [optimistic], 'turn-current'), true)
  assert.equal(legacyDuplicateQueuedMessageId([duplicate], [optimistic], [original], 'turn-current'), duplicate.id)
})
