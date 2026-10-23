import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/messageChoices.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { parseAssistantChoiceContent, parseStructuredAssistantQuestions, formatAssistantChoiceReply } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('keeps an either-or assistant question actionable after progress text', () => {
  const content = parseAssistantChoiceContent('只删版本记录，还是也从本地 Git 历史移除这两条提交（保留文件改动）？\n- 只删文字和版本记录，保留本地提交\n- 也从本地历史移除这两条提交\n\n我核实到 Logo 文件还有一个旧副本。')
  assert.deepEqual(content.groups, [{
    question: '只删版本记录，还是也从本地 Git 历史移除这两条提交（保留文件改动）？',
    options: ['只删文字和版本记录，保留本地提交', '也从本地历史移除这两条提交'],
  }])
  assert.equal(content.onlyChoices, false)
})

test('reads structured async questions and formats a custom answer', () => {
  const groups = parseStructuredAssistantQuestions([{ title: '怎么处理本地提交？', options: [
    { label: '保留提交', description: '只清理版本记录' },
    { label: '移除提交' },
  ] }])
  assert.deepEqual(groups, [{ question: '怎么处理本地提交？', options: ['保留提交', '移除提交'], descriptions: ['只清理版本记录', ''] }])
  assert.equal(formatAssistantChoiceReply(groups, [-2], ['其他处理方式']), '1. 怎么处理本地提交？\n答：其他处理方式')
})
