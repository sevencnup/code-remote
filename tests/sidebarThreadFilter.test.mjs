import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterSidebarThreads } from '../src/lib/sidebarThreadFilter.mjs'

const threads = [
  { id: 'codex-old', name: '整理代码', preview: '重构入口' },
  { id: 'codex-new', engine: 'codex', name: '写文档', preview: '更新 README' },
  { id: 'claude', engine: 'claude-code', name: '分析测试', preview: '修复用例' },
]

test('returns all chats without a mode filter and treats legacy chats as Codex', () => {
  assert.deepEqual(filterSidebarThreads(threads, null).map(({ id }) => id), ['codex-old', 'codex-new', 'claude'])
  assert.deepEqual(filterSidebarThreads(threads, 'codex').map(({ id }) => id), ['codex-old', 'codex-new'])
  assert.deepEqual(filterSidebarThreads(threads, 'claude-code').map(({ id }) => id), ['claude'])
})

test('combines mode filtering with a case-insensitive search over names and previews', () => {
  assert.deepEqual(filterSidebarThreads(threads, 'codex', 'readme').map(({ id }) => id), ['codex-new'])
  assert.deepEqual(filterSidebarThreads(threads, 'claude-code', 'ANALYSE'), [])
  assert.deepEqual(filterSidebarThreads(threads, 'claude-code', '修复').map(({ id }) => id), ['claude'])
})
