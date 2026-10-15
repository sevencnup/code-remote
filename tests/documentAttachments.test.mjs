import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
import * as XLSX from '@e965/xlsx'

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText

const rulesSource = compile(await readFile(new URL('../src/lib/documentAttachmentRules.ts', import.meta.url), 'utf8'))
const rulesUrl = `data:text/javascript;base64,${Buffer.from(rulesSource).toString('base64')}`
const parserSource = compile(await readFile(new URL('../src/lib/documentAttachments.ts', import.meta.url), 'utf8'))
  .replace(/from ["']fflate["']/, `from '${import.meta.resolve('fflate')}'`)
  .replace(/from ["']\.\/documentAttachmentRules["']/, `from '${rulesUrl}'`)
  .replace(/import\(["']@e965\/xlsx["']\)/, `import('${import.meta.resolve('@e965/xlsx')}')`)
  .replace(/import\(["']pdfjs-dist["']\)/, `import('${import.meta.resolve('pdfjs-dist')}')`)
const parserUrl = `data:text/javascript;base64,${Buffer.from(parserSource).toString('base64')}`
const { attachmentAcceptForLayout, documentAttachmentAccept, isSupportedDocumentFile } = await import(rulesUrl)
const { readDocumentAttachment } = await import(parserUrl)

test('mobile file pickers avoid large accept filters while desktop keeps supported document types', () => {
  assert.equal(attachmentAcceptForLayout(true), undefined)
  assert.equal(attachmentAcceptForLayout(false), documentAttachmentAccept)
  assert.ok(documentAttachmentAccept.includes('.docx'))
  assert.ok(documentAttachmentAccept.includes('.tsx'))
})

test('accepts common documents, data formats, source files, and dotfiles', () => {
  const supportedNames = [
    'report.pdf', 'letter.docx', 'macro.docm', 'legacy.xls', 'data.xlsx', 'macro.xlsm', 'slides.pptx', 'macro.pptm', 'notes.odt',
    'table.ods', 'presentation.odp', 'flat.fodt', 'manual.md', 'sheet.csv', 'data.json5', 'config.yaml',
    'source.tsx', 'main.rs', 'Dockerfile', '.env.local',
  ]
  for (const name of supportedNames) assert.equal(isSupportedDocumentFile({ name, type: '' }), true, name)
  assert.equal(isSupportedDocumentFile({ name: 'archive.exe', type: 'application/octet-stream' }), false)
})

test('extracts plain text and preserves its original filename', async () => {
  const result = await readDocumentAttachment(new File(['你好，Codex\n第二行'], '说明.md', { type: 'text/markdown' }))
  assert.equal(result.name, '说明.md')
  assert.equal(result.content, '你好，Codex\n第二行')
  assert.equal(result.truncated, false)
})

test('decodes UTF-16 text and converts basic RTF paragraph controls', async () => {
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('你好', 'utf16le')])
  const decoded = await readDocumentAttachment(new File([utf16], 'utf16.txt', { type: 'text/plain' }))
  assert.equal(decoded.content, '你好')

  const rtf = await readDocumentAttachment(new File(['{\\rtf1\\ansi Hello\\par \\u20320?}'], 'note.rtf', { type: 'application/rtf' }))
  assert.equal(rtf.content, 'Hello\n你')
})

test('extracts readable worksheet values from XLSX', async () => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['姓名', '分数'], ['小明', 98]]), '成绩')
  const bytes = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const result = await readDocumentAttachment(new File([bytes], 'scores.xlsx'))
  assert.match(result.content, /工作表：成绩/)
  assert.match(result.content, /姓名\t分数/)
  assert.match(result.content, /小明\t98/)
})

test('preserves extracted text beyond the former character limit', async () => {
  const text = '界'.repeat(45_000)
  const result = await readDocumentAttachment(new File([text], 'long.txt', { type: 'text/plain' }))
  assert.equal(result.truncated, false)
  assert.equal(result.content, text)
})

test('rejects unsupported and oversized files with actionable messages', async () => {
  await assert.rejects(readDocumentAttachment(new File(['binary'], 'archive.exe')), /不支持/)
  await assert.rejects(readDocumentAttachment({ name: 'large.txt', type: 'text/plain', size: 20 * 1024 * 1024 + 1 }), /20 MB/)
  await assert.rejects(readDocumentAttachment(new File(['binary'], 'old.doc')), /另存为 \.docx/)
})
