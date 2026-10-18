import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/terminalPathCommand.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const { terminalChangeDirectoryCommand } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

test('quotes POSIX paths with spaces and apostrophes', () => {
  assert.equal(terminalChangeDirectoryCommand('bash', "/work/O'Brien files"), "cd -- '/work/O'\\''Brien files'")
  assert.equal(terminalChangeDirectoryCommand('/bin/zsh', '/work/project'), "cd -- '/work/project'")
})

test('uses PowerShell literal paths and doubles embedded apostrophes', () => {
  assert.equal(terminalChangeDirectoryCommand('pwsh.exe', "C:\\work\\O'Brien files"), "Set-Location -LiteralPath 'C:\\work\\O''Brien files'")
  assert.equal(terminalChangeDirectoryCommand('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 'C:\\work\\project'), "Set-Location -LiteralPath 'C:\\work\\project'")
})

test('uses the drive-aware directory command in cmd', () => {
  assert.equal(terminalChangeDirectoryCommand('cmd.exe', 'D:\\work files\\project'), 'cd /d "D:\\work files\\project"')
})
