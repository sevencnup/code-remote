import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const terminalSource = await readFile(new URL('../src/components/TerminalDialog.tsx', import.meta.url), 'utf8')
const stylesSource = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('desktop terminal paste uses the clipboard directly and falls back to native paste without an input dialog', () => {
  const pasteHandler = terminalSource.slice(
    terminalSource.indexOf('  const pasteIntoTerminal = async () => {'),
    terminalSource.indexOf('  const submitManualPaste', terminalSource.indexOf('  const pasteIntoTerminal = async () => {')),
  )

  assert.match(pasteHandler, /const value = await readTextFromClipboard\(\)/)
  assert.match(pasteHandler, /if \(value\) terminalActions\.current\.paste\(value\)/)
  assert.match(pasteHandler, /if \(window\.matchMedia\('\(pointer: coarse\)'\)\.matches\) \{[\s\S]*?setManualPasteOpen\(true\)[\s\S]*?\} else \{[\s\S]*?terminalActions\.current\.focus\(\)[\s\S]*?setDesktopPasteHintVisible\(true\)/)
  assert.match(terminalSource, /if \(key === 'v'\)[\s\S]*?return false/)
  assert.match(terminalSource, /终端已聚焦，请按 Ctrl\/⌘\+V 粘贴/)
})

test('terminal font follows the workspace tree size and observes global font preference changes', () => {
  assert.match(stylesSource, /\.workspace-explorer__entry \{[^}]*font-size: calc\(14px \+ var\(--mobile-font-offset\)\)/)
  assert.match(stylesSource, /\.terminal-dialog__screen \{[^}]*font-size: calc\(14px \+ var\(--mobile-font-offset\)\)/)
  assert.match(terminalSource, /const fontSize = Number\.parseFloat\(window\.getComputedStyle\(container\)\.fontSize\)/)
  assert.match(terminalSource, /fontSize: readFontSize\(\)/)
  assert.match(terminalSource, /new MutationObserver\(updateFontSize\)/)
  assert.match(terminalSource, /fontPreferenceObserver\.observe\(appRoot, \{ attributes: true, attributeFilter: \['style'\] \}\)/)
})
