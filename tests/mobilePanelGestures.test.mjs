import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/mobilePanelGestures.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { beginMobilePanelGesture, resolveMobilePanelGesture } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`,
)

test('locks the gesture target to the half where the touch starts', () => {
  const leftStart = beginMobilePanelGesture(99, 20, 200, false, false)
  const rightStart = beginMobilePanelGesture(100, 20, 200, false, false)

  assert.equal(leftStart?.panel, 'sidebar')
  assert.equal(rightStart?.panel, 'workspace')
  assert.equal(resolveMobilePanelGesture(leftStart, 170, 20), 'open-sidebar')
  assert.equal(resolveMobilePanelGesture(leftStart, 145, 20), 'open-sidebar')
  assert.equal(resolveMobilePanelGesture(rightStart, 29, 20), 'open-workspace')
})

test('only the open panel can be closed from its own half', () => {
  const sidebarStart = beginMobilePanelGesture(95, 20, 200, true, false)
  const workspaceStart = beginMobilePanelGesture(105, 20, 200, false, true)

  assert.equal(resolveMobilePanelGesture(sidebarStart, 20, 20), 'close-sidebar')
  assert.equal(resolveMobilePanelGesture(workspaceStart, 180, 20), 'close-workspace')
  assert.equal(beginMobilePanelGesture(180, 20, 200, true, false), null)
  assert.equal(beginMobilePanelGesture(20, 20, 200, false, true), null)
})

test('ignores short swipes, vertical movement, and the wrong direction', () => {
  const leftStart = beginMobilePanelGesture(80, 20, 200, false, false)
  const rightStart = beginMobilePanelGesture(120, 20, 200, false, false)

  assert.equal(resolveMobilePanelGesture(leftStart, 123, 20), null)
  assert.equal(resolveMobilePanelGesture(leftStart, 160, 100), null)
  assert.equal(resolveMobilePanelGesture(leftStart, 5, 20), null)
  assert.equal(resolveMobilePanelGesture(rightStart, 195, 20), null)
})
