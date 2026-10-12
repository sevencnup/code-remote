import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/workspaceSelection.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
})
const { createWorkspaceSelectionDocument, formatWorkspaceSelectionReference, workspaceTextSelectionLineRange } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

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
