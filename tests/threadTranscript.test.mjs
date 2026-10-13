import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/threadTranscript.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const {
  createThreadTranscript,
  threadTranscriptFilename,
  threadTranscriptTruncationMarker,
  truncateThreadTranscriptForAttachment,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('creates a readable Markdown transcript with messages and attachment notes', () => {
  const transcript = createThreadTranscript({
    id: 'thread-123',
    name: '发布 / 检查',
    cwd: '/workspace/project',
  }, [
    {
      id: 'user-1',
      role: 'user',
      text: '请检查这个截图和说明。',
      createdAt: '2026-10-13T10:00:00.000Z',
      images: [{ name: 'screen.png', previewUrl: 'data:image/png;base64,abc' }],
      documents: [
        { name: 'notes.md', content: '第一行\n```ts\nconst answer = 42\n```', charCount: 28 },
        { name: 'invoice.pdf', content: '', sourceFileId: 'secret-pdf-id', charCount: 0 },
      ],
    },
    {
      id: 'assistant-1',
      role: 'assistant',
      text: '我已经检查完。',
      createdAt: '2026-10-13T10:00:03.000Z',
      replyDurationMs: 3500,
    },
  ], { generatedAt: '2026-10-13T11:00:00.000Z' })

  assert.match(transcript, /# 对话记录/)
  assert.match(transcript, /对话 ID：`thread-123`/)
  assert.match(transcript, /工作目录：`\/workspace\/project`/)
  assert.match(transcript, /### 1\. 用户/)
  assert.match(transcript, /请检查这个截图和说明。/)
  assert.match(transcript, /图片附件/)
  assert.match(transcript, /screen\.png/)
  assert.match(transcript, /文档附件/)
  assert.match(transcript, /const answer = 42/)
  assert.match(transcript, /原始 PDF 附件/)
  assert.match(transcript, /需要时请重新上传/)
  assert.doesNotMatch(transcript, /secret-pdf-id/)
  assert.match(transcript, /回复用时：`3500 ms`/)
})

test('creates a safe, recognizable Markdown filename', () => {
  assert.equal(
    threadTranscriptFilename({ id: 'thread-1', name: '项目: A/B * 复盘?' }),
    '对话记录-项目- A-B - 复盘.md',
  )
})

test('truncates a quoted transcript by retaining its beginning and ending', () => {
  const source = `开头-${'中间内容'.repeat(100)}-结尾`
  const result = truncateThreadTranscriptForAttachment(source, 100)

  assert.equal(result.truncated, true)
  assert.ok(result.content.length <= 100)
  assert.match(result.content, /^开头-/)
  assert.match(result.content, /-结尾$/)
  assert.ok(result.content.includes(threadTranscriptTruncationMarker))
})
