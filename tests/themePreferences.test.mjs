import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/themePreferences.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const {
  isCompactThemeBackgroundImage,
  normalizeHexColor,
  normalizeTransparency,
  readThemePreferences,
  saveThemePreferences,
  themeRootStyle,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const defaultPreferences = {
  theme: 'dark',
  customBackgroundColor: '#4b5563',
  customTextColor: '#f1f5f9',
  customBackgroundTransparency: 0,
  customBackgroundPositionX: 50,
  customBackgroundPositionY: 50,
  customBackgroundZoom: 100,
  fontSizeAdjustment: 0,
  systemNotificationsEnabled: false,
}

async function withLocalStorage(storage, run) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  })
  try {
    await run()
  } finally {
    if (originalDescriptor) Object.defineProperty(globalThis, 'window', originalDescriptor)
    else delete globalThis.window
  }
}

test('uses safe defaults when preferences are missing, malformed, or unavailable', async () => {
  assert.deepEqual(readThemePreferences(), defaultPreferences)
  await withLocalStorage({ getItem: () => '{invalid json' }, async () => {
    assert.deepEqual(readThemePreferences(), defaultPreferences)
  })
  await withLocalStorage({ getItem: () => null }, async () => {
    assert.deepEqual(readThemePreferences(), defaultPreferences)
  })
})

test('normalizes stored theme values and ignores invalid background images', async () => {
  const stored = JSON.stringify({
    theme: 'custom',
    customBackgroundColor: '#a1b2c3',
    customTextColor: 'white',
    customBackgroundTransparency: 134.6,
    customBackgroundImage: 'https://example.test/background.png',
  })
  await withLocalStorage({ getItem: () => stored }, async () => {
    assert.deepEqual(readThemePreferences(), {
      theme: 'custom',
      customBackgroundColor: '#A1B2C3',
      customTextColor: defaultPreferences.customTextColor,
      customBackgroundTransparency: 100,
      customBackgroundPositionX: 50,
      customBackgroundPositionY: 50,
      customBackgroundZoom: 100,
      fontSizeAdjustment: 0,
      systemNotificationsEnabled: false,
    })
  })
})

test('round-trips saved theme preferences through local storage', async () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  const preferences = {
    theme: 'warm',
    customBackgroundColor: '#123456',
    customTextColor: '#ABCDEF',
    customBackgroundTransparency: 42,
    customBackgroundPositionX: 37.5,
    customBackgroundPositionY: 62,
    customBackgroundZoom: 145,
    fontSizeAdjustment: 0,
    systemNotificationsEnabled: false,
  }

  await withLocalStorage(storage, async () => {
    saveThemePreferences(preferences)
    assert.deepEqual(readThemePreferences(), preferences)
  })
})

test('recognizes and persists the retro web theme', async () => {
  const values = new Map([['codex-remote.theme-preferences', JSON.stringify({ ...defaultPreferences, theme: 'retro' })]])
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  await withLocalStorage(storage, async () => {
    assert.equal(readThemePreferences().theme, 'retro')
    saveThemePreferences({ ...defaultPreferences, theme: 'retro' })
    assert.equal(readThemePreferences().theme, 'retro')
  })
})

test('recognizes and persists the pixel theme', async () => {
  const values = new Map([['codex-remote.theme-preferences', JSON.stringify({ ...defaultPreferences, theme: 'pixel' })]])
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }

  await withLocalStorage(storage, async () => {
    assert.equal(readThemePreferences().theme, 'pixel')
    saveThemePreferences({ ...defaultPreferences, theme: 'pixel' })
    assert.equal(readThemePreferences().theme, 'pixel')
  })
})

test('normalizes colors and clamps transparency', () => {
  assert.equal(normalizeHexColor('#aBc123', '#000000'), '#ABC123')
  assert.equal(normalizeHexColor('red', '#000000'), '#000000')
  assert.equal(normalizeTransparency(-8), 0)
  assert.equal(normalizeTransparency(100.6), 100)
  assert.equal(normalizeTransparency(34.6), 35)
  assert.equal(normalizeTransparency(Number.NaN), 0)
})

test('normalizes background crop position and zoom', async () => {
  const stored = JSON.stringify({
    ...defaultPreferences,
    customBackgroundPositionX: -20,
    customBackgroundPositionY: 104.44,
    customBackgroundZoom: 999,
  })
  await withLocalStorage({ getItem: () => stored }, async () => {
    const preferences = readThemePreferences()
    assert.equal(preferences.customBackgroundPositionX, 0)
    assert.equal(preferences.customBackgroundPositionY, 100)
    assert.equal(preferences.customBackgroundZoom, 250)
  })
})

test('accepts compact supported image data URLs only', () => {
  assert.equal(isCompactThemeBackgroundImage('data:image/png;base64,aGVsbG8='), true)
  assert.equal(isCompactThemeBackgroundImage('data:image/svg+xml;base64,aGVsbG8='), false)
  assert.equal(isCompactThemeBackgroundImage('not-an-image'), false)
})

test('generates consistent global custom-theme CSS variables', () => {
  assert.deepEqual(themeRootStyle({
    theme: 'custom',
    customBackgroundColor: '#336699',
    customTextColor: '#AABBCC',
    customBackgroundTransparency: 75,
    customBackgroundPositionX: 25,
    customBackgroundPositionY: 70,
    customBackgroundZoom: 150,
    customBackgroundImage: 'data:image/png;base64,aGVsbG8=',
  }), {
    '--custom-theme-background': '#336699',
    '--custom-theme-background-opacity': 0.25,
    '--custom-theme-background-position': '25% 70%',
    '--custom-theme-background-zoom': 1.5,
    '--custom-theme-background-image': 'linear-gradient(rgba(0, 0, 0, .2), rgba(0, 0, 0, .2)), url("data:image/png;base64,aGVsbG8=")',
    '--custom-theme-text-color': '#AABBCC',
    '--custom-theme-surface': 'rgba(51, 102, 153, 0.38)',
    '--custom-theme-control': 'rgba(51, 102, 153, 0.58)',
    '--custom-theme-active': 'rgba(51, 102, 153, 0.24)',
    '--custom-theme-border': 'rgba(170, 187, 204, 0.32)',
    '--custom-theme-panel-blur': '8px',
    '--user-font-offset': '0px',
  })
})

test('storage write failures do not prevent the app from running', async () => {
  await withLocalStorage({
    setItem: () => { throw new Error('storage unavailable') },
  }, async () => {
    assert.doesNotThrow(() => saveThemePreferences(defaultPreferences))
  })
})

test('keeps the page module Fast Refresh boundary limited to its React component', async () => {
  const pageSource = await readFile(new URL('../src/components/CodexRemotePage.tsx', import.meta.url), 'utf8')
  const runtimeExportNames = [...pageSource.matchAll(/^export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([\w$]+)/gm)]
    .map((match) => match[1])

  assert.deepEqual(runtimeExportNames, ['CodexRemotePage'])
})
