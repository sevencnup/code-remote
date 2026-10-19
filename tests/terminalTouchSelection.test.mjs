import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const helperSource = await readFile(new URL('../src/lib/terminalTouchSelection.ts', import.meta.url), 'utf8')
const componentSource = await readFile(new URL('../src/components/TerminalDialog.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { restoreTerminalTouchSelection } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

test('restores a cached terminal word selection and returns its original text', () => {
  const calls = []
  const selection = {
    point: { x: 42, y: 18 },
    text: 'selected-word',
    range: { start: { x: 7, y: 12 }, end: { x: 20, y: 12 } },
  }

  assert.equal(restoreTerminalTouchSelection({ cols: 80, select: (...args) => calls.push(args) }, selection), 'selected-word')
  assert.deepEqual(calls, [[7, 12, 13]])
})

test('restores selections spanning wrapped terminal rows', () => {
  const calls = []
  const selection = {
    point: { x: 42, y: 18 },
    text: 'wrapped selection',
    range: { start: { x: 72, y: 4 }, end: { x: 5, y: 5 } },
  }

  assert.equal(restoreTerminalTouchSelection({ cols: 80, select: (...args) => calls.push(args) }, selection), 'wrapped selection')
  assert.deepEqual(calls, [[72, 4, 13]])
})

test('keeps the selected text for a later context-menu action', () => {
  const longPressCapture = componentSource.slice(
    componentSource.indexOf('longPressTimer = window.setTimeout(() => {'),
    componentSource.indexOf('    const handleTouchMove', componentSource.indexOf('longPressTimer = window.setTimeout(() => {')),
  )
  const touchEnd = componentSource.slice(
    componentSource.indexOf('    const handleTouchEnd = () => {'),
    componentSource.indexOf('    const handleMouseUp', componentSource.indexOf('    const handleTouchEnd = () => {')),
  )
  const contextMenu = componentSource.slice(
    componentSource.indexOf('    const handleContextMenu = (event: MouseEvent) => {'),
    componentSource.indexOf('    container.addEventListener(\'contextmenu\'', componentSource.indexOf('    const handleContextMenu = (event: MouseEvent) => {')),
  )

  assert.match(longPressCapture, /longPressSelection = cacheTerminalSelection\(point\)/)
  assert.match(touchEnd, /retainTouchSelection\(selection\)/)
  assert.doesNotMatch(touchEnd, /showContextMenu/)
  assert.match(contextMenu, /retainedTouchSelection \?\? longPressSelection \?\? cacheTerminalSelection\(\)/)
  assert.match(contextMenu, /showContextMenu\(event\.clientX, event\.clientY, selection\.text\)/)
})
