import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const source = await readFile(new URL('../src/hooks/useCodexRemote.ts', import.meta.url), 'utf8')

test('WebSocket effect uses the latest event handler without restarting when it changes', () => {
  const effectStart = source.indexOf('  useEffect(() => {', source.indexOf('  const handleEvent = useCallback'))
  const effectEnd = source.indexOf('  const selectThread = useCallback', effectStart)
  assert.notEqual(effectStart, -1)
  assert.notEqual(effectEnd, -1)

  const connectionEffect = source.slice(effectStart, effectEnd)
  const dependencyList = connectionEffect.match(/\n  \}, \[([^\n]+)\]\)\s*$/)

  assert.match(source, /const handleEventRef = useRef\(handleEvent\)/)
  assert.match(source, /handleEventRef\.current = handleEvent/)
  assert.match(connectionEffect, /handleEventRef\.current\(event\)/)
  assert.ok(dependencyList, 'connection effect dependencies should be explicit')
  assert.doesNotMatch(dependencyList[1], /\bhandleEvent\b/)
})
