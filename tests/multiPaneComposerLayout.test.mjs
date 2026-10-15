import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const page = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('multi-pane queue placeholder uses the real collapsed card geometry', () => {
  assert.ok(page.includes('className="composer-queue composer-queue--collapsed composer-queue--placeholder"'))
  assert.ok(page.includes('className={`composer-queue${queuedMessagesExpanded ? \' composer-queue--expanded\' : \' composer-queue--collapsed\'}`}'))
  assert.ok(styles.includes('.composer-queue--placeholder { visibility: hidden; pointer-events: none; }'))
  assert.ok(!styles.includes('composer-queue-spacer'))
  assert.ok(page.includes(') : reserveQueuedMessageSpace ? ('))
})

test('running file changes reserve a matching slot across open panes', () => {
  assert.ok(page.includes('remote.fileChangesByTurn[remote.runningTurnId]?.some((change) => change.changes.length > 0)'))
  assert.ok(page.includes('reserveFileChangeSummarySpace={openPaneIndexes.length > 1 && Boolean(hasRunningFileChangesInOpenPanes)}'))
  assert.ok(page.includes('className="composer-file-change-summary composer-file-change-summary--placeholder"'))
  assert.ok(page.includes('reserveFileChangeSummarySpace && !mobileLayout'))
  assert.ok(styles.includes('.composer-file-change-summary--placeholder { visibility: hidden; pointer-events: none; }'))
})

test('image-draft restore and manual resizing do not add transient layout height on a pane switch', () => {
  assert.ok(page.includes('{readingImages ? <p className="attachment-reading"'))
  assert.ok(!page.includes('!imagesReady || readingImages ? <p className="attachment-reading"'))
  assert.ok(page.includes("!imagesReady ? '正在恢复待发送图片…'"))
  assert.ok(page.includes('if (composerHeightMemory.current?.manuallyResized) return composerHeightMemory.current.height'))
  assert.ok(page.includes('composerHeightMemory.current = { height: composerHeight, manuallyResized: composerHeightWasResized.current }'))
})

test('mobile code blocks wrap long PowerShell commands while desktop keeps horizontal scrolling', () => {
  const codeBlockRule = styles.match(/\.chat-message__code \{([^}]+)\}/)?.[1] ?? ''
  const mobileMediaRule = styles.match(/@media \(max-width: 700px\) \{([\s\S]*?)^\}/m)?.[1] ?? ''
  const mobileCodeRule = mobileMediaRule.match(/\.chat-message__code \{([^}]+)\}/)?.[1] ?? ''

  assert.match(codeBlockRule, /overflow:\s*auto/)
  assert.match(codeBlockRule, /white-space:\s*pre(?:;|\s)/)
  assert.match(codeBlockRule, /box-sizing:\s*border-box/)
  assert.match(codeBlockRule, /width:\s*100%/)
  assert.match(codeBlockRule, /max-width:\s*100%/)
  assert.match(mobileCodeRule, /white-space:\s*pre-wrap/)
  assert.match(mobileCodeRule, /overflow-wrap:\s*anywhere/)
})

test('mobile chat header is shorter without changing the desktop row height', () => {
  assert.ok(styles.includes('grid-template-rows: 60px minmax(0, 1fr) auto auto auto'))
  assert.ok(styles.includes('grid-template-rows: 50px minmax(0, 1fr) auto auto auto'))
})

test('mobile sidebar exposes a no-transition drag state for direct touch tracking', () => {
  assert.ok(styles.includes('.remote-sidebar--dragging { transform: translateX(var(--sidebar-drag-offset, -105%)); transition: none; }'))
  assert.ok(styles.includes('.remote-shell--sidebar-dragging .sidebar-backdrop { transition: none; }'))
  assert.ok(styles.includes('var(--sidebar-backdrop-opacity, .2)'))
  assert.ok(page.includes("(sidebarDragging ? ' remote-shell--sidebar-dragging' : '')"))
  assert.match(page, /onTouchMoveCapture=\{handleSidebarTouchMove\}/)
  assert.ok(page.includes("style.setProperty('--sidebar-drag-offset'"))
  assert.ok(page.includes("style.removeProperty('--sidebar-drag-offset')"))
  assert.ok(page.includes("const start = startedInsideSidebar\r\n      ? { panel: 'sidebar' as const"))
})

test('mobile workspace drawer follows touch position and keeps its backdrop synchronized', () => {
  assert.ok(styles.includes('.workspace-explorer--dragging { transform: translateX(var(--workspace-drag-offset, 105%)); transition: none; }'))
  assert.ok(styles.includes('.remote-shell--workspace-dragging .workspace-backdrop { transition: none; }'))
  assert.ok(styles.includes('var(--workspace-backdrop-opacity, .2)'))
  assert.ok(page.includes("(workspaceDragging ? ' remote-shell--workspace-dragging' : '')"))
  assert.ok(page.includes('mobileDragging={workspaceDragging}'))
  assert.ok(page.includes("style.setProperty('--workspace-drag-offset'"))
  assert.ok(page.includes('mobileWorkspaceDragOffset(workspaceOpen, workspace.panelWidth, deltaX)'))
  assert.ok(page.includes('shouldOpenMobileWorkspaceAfterDrag(workspace.offset, workspace.panelWidth, action)'))
})
