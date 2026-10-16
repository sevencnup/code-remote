import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const pageSource = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')
const stylesSource = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('assistant messages use the active pane engine name', () => {
  assert.match(pageSource, /assistantName=\{activeEngineLabel\}/)
  assert.match(pageSource, /const activeEngineLabel = remote\.activeEngine === 'claude-code' \? 'Claude Code' : 'Codex'/)
  assert.match(pageSource, /assistantName: string/)
  assert.match(pageSource, /<strong className=\{`chat-message__assistant-name/)
  assert.match(pageSource, />\{assistantName\}<\/strong>/)
  assert.doesNotMatch(pageSource, /message\.role === 'assistant' \? <strong>Codex<\/strong>/)
  assert.match(pageSource, /chat-message__assistant-name--\$\{assistantName === 'Claude Code' \? 'claude' : 'codex'\}/)
  assert.match(stylesSource, /\.remote-shell \.chat-message--assistant \.chat-message__meta > \.chat-message__assistant-name--codex \{ color: #c8d0ff; \}/)
  assert.match(stylesSource, /\.remote-shell \.chat-message--assistant \.chat-message__meta > \.chat-message__assistant-name--claude \{ color: #ee8c6d; \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__body \{ border: 0; background: rgba\(200, 208, 255, \.32\); \}/)
  assert.match(stylesSource, /\.remote-shell--theme-light \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__body,\s*\.remote-shell--theme-warm \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__body \{ background: rgba\(200, 208, 255, \.28\); \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat--claude \.chat-message--user \.chat-message__body \{ border: 1px solid #ee8c6d; \}/)
})
