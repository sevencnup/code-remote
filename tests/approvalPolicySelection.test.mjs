import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const page = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')

test('choosing approval mode saves the composer preference without taking over the thread', () => {
  const start = page.indexOf('const changeApprovalPolicy = useCallback(')
  const end = page.indexOf('  useEffect(', start)
  assert.ok(start >= 0 && end > start)
  const selection = page.slice(start, end)
  assert.match(selection, /updateComposerPreferences/)
  assert.doesNotMatch(selection, /updateApprovalPolicy/)
  assert.match(page, /approvalPolicy: selectedApprovalPolicy,/)
})
