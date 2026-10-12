import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/workspaceSelection.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const {
  createWorkspaceSelectionDocument,
  formatWorkspaceSelectionReference,
  numberWorkspaceSelectionDocument,
  sameWorkspaceSelectionDocument,
  workspaceSelectionMenuPosition,
  workspaceTextSelectionLineRange,
} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('calculates selected text line ranges with LF and CRLF endings', () => {
  const text = 'one\r\ntwo\r\nthree\n'

  assert.deepEqual(workspaceTextSelectionLineRange(text, 5, 13), { startLine: 2, endLine: 3 })
  assert.deepEqual(workspaceTextSelectionLineRange(text, 0, 5), { startLine: 1, endLine: 1 })
  assert.equal(workspaceTextSelectionLineRange(text, 4, 4), null)
})

test('formats an absolute file path, selected line range, and code snippet', () => {
  assert.equal(
    formatWorkspaceSelectionReference('/workspace/src/app.ts', 12, 14, 'const answer = 42\nreturn answer'),
    '文件：`/workspace/src/app.ts`（第 12–14 行）\n```\nconst answer = 42\nreturn answer\n```',
  )
})

test('chooses safe Markdown delimiters when the selected code contains backticks', () => {
  assert.equal(
    formatWorkspaceSelectionReference('`notes`.md', 3, 3, '```js\ncode\n```'),
    '文件：`` `notes`.md ``（第 3 行）\n````\n```js\ncode\n```\n````',
  )
})

test('creates a Markdown document attachment with the source path and selected lines', () => {
  assert.deepEqual(
    createWorkspaceSelectionDocument('C:\\workspace\\src\\app.ts', 8, 10, 'const answer = 42'),
    {
      name: 'app.ts-L8-10-selection.md',
      content: '文件：`C:\\workspace\\src\\app.ts`（第 8–10 行）\n```\nconst answer = 42\n```',
    },
  )
})

test('adds a trimmed optional note before the selected code and source reference', () => {
  assert.deepEqual(
    createWorkspaceSelectionDocument('/workspace/src/app.ts', 8, 10, 'const answer = 42', '  把这个值改成动态计算。\n再补一个边界检查。  '),
    {
      name: 'app.ts-L8-10-selection.md',
      content: '备注：\n把这个值改成动态计算。\n再补一个边界检查。\n\n文件：`/workspace/src/app.ts`（第 8–10 行）\n```\nconst answer = 42\n```',
    },
  )
  assert.equal(
    createWorkspaceSelectionDocument('/workspace/src/app.ts', 8, 10, 'const answer = 42', '  ').content,
    '文件：`/workspace/src/app.ts`（第 8–10 行）\n```\nconst answer = 42\n```',
  )
})

test('numbers code selection documents in both the attachment name and Markdown content', () => {
  const first = createWorkspaceSelectionDocument('/workspace/src/app.ts', 2, 2, 'const first = true')
  const second = createWorkspaceSelectionDocument('/workspace/src/app.ts', 8, 9, 'const second = true')

  assert.deepEqual(numberWorkspaceSelectionDocument(first, []), {
    name: '【代码选区 #1】 app.ts-L2-selection.md',
    content: '代码选区 #1\n\n文件：`/workspace/src/app.ts`（第 2 行）\n```\nconst first = true\n```',
  })
  const numberedSecond = numberWorkspaceSelectionDocument(second, [first])
  assert.match(numberedSecond.name, /^【代码选区 #2】 /)
  assert.match(numberedSecond.content, /^代码选区 #2\n\n/)
})

test('keeps surviving selection numbers stable and assigns new selections after the highest number', () => {
  const first = numberWorkspaceSelectionDocument(createWorkspaceSelectionDocument('/workspace/a.ts', 1, 1, 'one'), [])
  const second = numberWorkspaceSelectionDocument(createWorkspaceSelectionDocument('/workspace/a.ts', 2, 2, 'two'), [first])
  const third = numberWorkspaceSelectionDocument(createWorkspaceSelectionDocument('/workspace/a.ts', 3, 3, 'three'), [first, second])
  const next = numberWorkspaceSelectionDocument(createWorkspaceSelectionDocument('/workspace/a.ts', 4, 4, 'four'), [first, third])

  assert.equal(second.name, '【代码选区 #2】 a.ts-L2-selection.md')
  assert.equal(third.name, '【代码选区 #3】 a.ts-L3-selection.md')
  assert.equal(next.name, '【代码选区 #4】 a.ts-L4-selection.md')
})

test('does not number ordinary documents and recognizes the same selection after numbering', () => {
  const ordinary = { name: 'notes.md', content: 'plain notes' }
  const selection = createWorkspaceSelectionDocument('/workspace/a.ts', 5, 5, 'const value = 5')
  const numbered = numberWorkspaceSelectionDocument(selection, [])

  assert.deepEqual(numberWorkspaceSelectionDocument(ordinary, []), ordinary)
  assert.equal(sameWorkspaceSelectionDocument(numbered, selection), true)
  assert.equal(sameWorkspaceSelectionDocument(numbered, createWorkspaceSelectionDocument('/workspace/a.ts', 6, 6, 'const value = 6')), false)
})

test('numbers selections with a note without mixing up the note and source reference', () => {
  const selection = createWorkspaceSelectionDocument('/workspace/a.ts', 5, 6, 'const value = 5', '改成读取配置项')
  const numbered = numberWorkspaceSelectionDocument(selection, [])

  assert.equal(numbered.name, '【代码选区 #1】 a.ts-L5-6-selection.md')
  assert.match(numbered.content, /^代码选区 #1\n\n备注：\n改成读取配置项\n\n文件：`\/workspace\/a\.ts`（第 5–6 行）/)
  assert.equal(sameWorkspaceSelectionDocument(numbered, selection), true)
})

test('places a mobile selection menu below the selected text when it fits', () => {
  assert.deepEqual(workspaceSelectionMenuPosition({
    anchorX: 270,
    anchorY: 100,
    viewportWidth: 360,
    viewportHeight: 640,
    menuWidth: 300,
    menuHeight: 132,
    selectionBounds: { top: 80, bottom: 230 },
  }), { x: 52, y: 238 })
})

test('moves the mobile selection menu above the selected text when it cannot fit below', () => {
  assert.deepEqual(workspaceSelectionMenuPosition({
    anchorX: 20,
    anchorY: 580,
    viewportWidth: 360,
    viewportHeight: 640,
    menuWidth: 300,
    menuHeight: 132,
    selectionBounds: { top: 500, bottom: 610 },
  }), { x: 20, y: 360 })
})

test('keeps selection menus within the viewport when the selection leaves limited room', () => {
  const position = workspaceSelectionMenuPosition({
    anchorX: 355,
    anchorY: 320,
    viewportWidth: 360,
    viewportHeight: 640,
    menuWidth: 300,
    menuHeight: 132,
    selectionBounds: { top: 100, bottom: 550 },
  })

  assert.deepEqual(position, { x: 52, y: 8 })
  assert.ok(position.y >= 8)
  assert.ok(position.y + 132 <= 632)
})

test('clamps the selection menu when selected text is already outside the viewport', () => {
  assert.deepEqual(workspaceSelectionMenuPosition({
    anchorX: 20,
    anchorY: 0,
    viewportWidth: 360,
    viewportHeight: 640,
    menuWidth: 300,
    menuHeight: 132,
    selectionBounds: { top: -80, bottom: -20 },
  }), { x: 20, y: 8 })
})
