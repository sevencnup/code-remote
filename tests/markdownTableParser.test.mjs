import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parseMarkdownTableBlock } from '../src/lib/markdownTableParser.mjs'

const [pageSource, styleSource] = await Promise.all([
  readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

test('parses bordered Markdown table rows and alignment markers', () => {
  const lines = [
    '| 名称 | 资料 | 备注 |',
    '| :--- | :---: | ---: |',
    '| 吉莱 | 锦联付汇资料 | 正常 |',
    '| 中外运 | 锦联付汇资料 | 待补 |',
    '',
    '后续文本',
  ]

  assert.deepEqual(parseMarkdownTableBlock(lines, 0), {
    headers: ['名称', '资料', '备注'],
    alignments: ['left', 'center', 'right'],
    rows: [
      ['吉莱', '锦联付汇资料', '正常'],
      ['中外运', '锦联付汇资料', '待补'],
    ],
    nextLine: 4,
  })
})

test('keeps escaped pipes inside cells and stops at rows with a different column count', () => {
  const lines = [
    '| 标题 | 内容 |',
    '| --- | --- |',
    '| A\\|B | 内容 |',
    '| 普通文本 |',
  ]

  assert.deepEqual(parseMarkdownTableBlock(lines, 0), {
    headers: ['标题', '内容'],
    alignments: ['left', 'left'],
    rows: [['A|B', '内容']],
    nextLine: 3,
  })
})

test('does not treat arbitrary pipe text or code-like rows as Markdown tables', () => {
  assert.equal(parseMarkdownTableBlock(['价格 | 单位', '这是普通文本'], 0), null)
  assert.equal(parseMarkdownTableBlock(['| a | b |', '| --- | 分隔文字 |'], 0), null)
})

test('renders parsed tables as safe semantic grids without changing fenced code blocks', () => {
  assert.match(pageSource, /if \(block\.type === 'code'\) return <CodeBlock/)
  assert.match(pageSource, /const table = parseMarkdownTableBlock\(lines, lineIndex\)/)
  assert.match(pageSource, /<thead>[\s\S]*<th[^>]+scope="col"/)
  assert.match(pageSource, /<tbody>[\s\S]*<td /)
  assert.doesNotMatch(pageSource, /dangerouslySetInnerHTML/)
  assert.match(styleSource, /\.chat-message__table th, \.chat-message__table td \{[^}]*border: 1px solid var\(--chat-message-table-border\)/)
  assert.match(styleSource, /\.chat-message__table-scroll \{[^}]*overflow: auto/)
  assert.match(styleSource, /\.remote-shell--theme-light \.chat-message__table-scroll/)
  assert.match(styleSource, /\.remote-shell--theme-warm \.chat-message__table-scroll/)
  assert.match(styleSource, /\.remote-shell--theme-custom \.chat-message__table-scroll/)
})
