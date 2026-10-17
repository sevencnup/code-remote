import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupSidebarThreads, sidebarThreadSection } from '../src/lib/sidebarThreadGroups.mjs'

const now = new Date(2026, 9, 17, 12)
const daysAgo = (days) => new Date(2026, 9, 17 - days, 23, 59).toISOString()
const thread = (id, days) => ({ id, updatedAt: daysAgo(days) })

test('groups by local calendar day at every sidebar boundary', () => {
  const cases = [
    [0, '今天'], [1, '最近 7 天'], [6, '最近 7 天'],
    [7, '15 天内'], [14, '15 天内'],
    [15, '30 天内'], [29, '30 天内'], [30, '更早'],
  ]
  for (const [days, expected] of cases) {
    assert.equal(sidebarThreadSection(thread(String(days), days), new Set(), now), expected)
  }
})

test('pinned threads lead and each section preserves incoming order', () => {
  const threads = [thread('today-1', 0), thread('pinned', 30), thread('today-2', 0), thread('week', 2)]
  assert.deepEqual(groupSidebarThreads(threads, new Set(['pinned']), now).map(({ label, threads: items }) => [label, items.map(({ id }) => id)]), [
    ['置顶', ['pinned']], ['今天', ['today-1', 'today-2']], ['最近 7 天', ['week']],
  ])
})

test('invalid timestamps fall back to the older section; createdAt works when updatedAt is absent', () => {
  assert.equal(sidebarThreadSection({ id: 'bad', updatedAt: 'not-a-date' }, new Set(), now), '更早')
  assert.equal(sidebarThreadSection({ id: 'created', createdAt: daysAgo(1) }, new Set(), now), '最近 7 天')
  assert.equal(sidebarThreadSection({ id: 'future', updatedAt: daysAgo(-1) }, new Set(), now), '今天')
})
