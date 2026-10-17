import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const [page, viewer, styles] = await Promise.all([
  readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/ImagePreviewButton.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
])

test('sent, draft, and queued images all use the shared viewer', () => {
  assert.match(page, /message\.images\.map\(\(image, imageIndex\) => <ImagePreviewButton/)
  assert.match(page, /attachedImages\.map\(\(image, index\) => .*<ImagePreviewButton/)
  assert.match(page, /message\.images\.map\(\(image, index\) => <ImagePreviewButton/)
  assert.match(page, /className="composer-image__remove"/)
})

test('the viewer opens a modal image and supports close, Escape, and viewport limits', () => {
  assert.match(viewer, /dialogRef\.current\.showModal\(\)/)
  assert.match(viewer, /onClose=\{\(\) => setOpen\(false\)\}/)
  assert.match(viewer, /aria-label="关闭图片预览"/)
  assert.match(styles, /\.chat-image-dialog__body img \{[^}]*max-width: 100%;[^}]*max-height: calc\(100dvh - 92px\)/)
})
