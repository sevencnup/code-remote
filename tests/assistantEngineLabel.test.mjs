import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const pageSource = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')
const stylesSource = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const androidSource = await readFile(new URL('../android/app/src/main/kotlin/com/sevencnup/codexremote/MainActivity.kt', import.meta.url), 'utf8')

test('assistant labels and Claude accents follow the active pane engine', () => {
  assert.match(pageSource, /assistantName=\{activeEngineLabel\}/)
  assert.match(pageSource, /const activeEngineLabel = remote\.activeEngine === 'claude-code' \? 'Claude Code' : 'Codex'/)
  assert.match(pageSource, /assistantName: string/)
  assert.match(pageSource, /<strong className=\{`chat-message__assistant-name/)
  assert.match(pageSource, />\{assistantName\}<\/strong>/)
  assert.doesNotMatch(pageSource, /message\.role === 'assistant' \? <strong>Codex<\/strong>/)
  assert.match(pageSource, /chat-message__assistant-name--\$\{assistantName === 'Claude Code' \? 'claude' : 'codex'\}/)
  assert.match(stylesSource, /\.remote-shell \.chat-message--assistant \.chat-message__meta > \.chat-message__assistant-name--codex \{ color: #c8d0ff; \}/)
  assert.match(stylesSource, /\.remote-shell \.chat-message--assistant \.chat-message__meta > \.chat-message__assistant-name--claude \{ color: #ee8c6d; \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__body \{ border: 0; background: #b3b8d5; \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__content,\s*\.remote-shell \.remote-chat:not\(\.remote-chat--claude\) \.chat-message--user \.chat-message__text \{ color: #000; \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat--claude \.chat-message--user \.chat-message__body \{ border: 0; background: #6d4539; \}/)
  assert.match(stylesSource, /\.remote-shell \.remote-chat--claude \.chat-message--user \.chat-message__content,\s*\.remote-shell \.remote-chat--claude \.chat-message--user \.chat-message__text \{ color: #fff3ee; \}/)
  assert.match(pageSource, /isClaudeCodeThread \? ' remote-shell--claude-mode' : ''/)
  assert.match(stylesSource, /\.remote-shell--claude-mode \.new-thread-button__icon \{ background: rgba\(238, 140, 109, \.18\); color: #ee8c6d; \}/)
  assert.match(stylesSource, /\.remote-shell--claude-mode \.thread-row \.engine-brand-icon--claude-code \{ background-color: #ee8c6d; color: #ee8c6d; \}/)
  assert.match(pageSource, /remote\.activeEngine === 'claude-code' && !currentRunningOperation && \(!remote\.activity \|\| remote\.activity\.label === '正在思考'\)/)
  assert.match(stylesSource, /\.running-indicator__activity--claude-thinking \.operation-activity__text \{ background-image: none; color: #ee8c6d; animation: none; -webkit-text-fill-color: #ee8c6d; \}/)
})

test('new conversation welcome titles use the active engine name', () => {
  assert.match(pageSource, /WelcomeTypingTitle text=\{remote\.activeEngine === 'claude-code' \? '与 Claude Code 完成一个伟大项目' : '与 Codex 完成一个伟大项目'\}/)
  assert.match(androidSource, /if \(currentMode == "claude-code"\) \{\s*"与 Claude Code 完成一个伟大项目"\s*\} else \{\s*"与 Codex 完成一个伟大项目"/)
  assert.doesNotMatch(pageSource, /与 Codex Remote 完成一个伟大项目/)
  assert.doesNotMatch(androidSource, /与 Codex Remote 完成一个伟大项目/)
})
