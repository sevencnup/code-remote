import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/messageInlineLinks.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { splitMessageInlineLinks } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('ends a bare URL before immediately adjacent Chinese prose', () => {
  assert.deepEqual(splitMessageInlineLinks('那能不能从https://github.com/router-for-me/CLIProxyAPI这个项目获取统计api，我用的是这个接入账号使用的'), [
    { type: 'text', value: '那能不能从' },
    { type: 'link', value: 'https://github.com/router-for-me/CLIProxyAPI', href: 'https://github.com/router-for-me/CLIProxyAPI' },
    { type: 'text', value: '这个项目获取统计api，我用的是这个接入账号使用的' },
  ])
})

test('keeps explicit Markdown link bounds and trailing text', () => {
  assert.deepEqual(splitMessageInlineLinks('查看[项目文档](https://example.com/docs)之后继续'), [
    { type: 'text', value: '查看' },
    { type: 'link', value: '项目文档', href: 'https://example.com/docs' },
    { type: 'text', value: '之后继续' },
  ])
})

test('keeps Chinese punctuation after bare URLs outside the link', () => {
  assert.deepEqual(splitMessageInlineLinks('打开www.example.com，然后继续'), [
    { type: 'text', value: '打开' },
    { type: 'link', value: 'www.example.com', href: 'https://www.example.com/' },
    { type: 'text', value: '，然后继续' },
  ])
})
