# Web Pixel Theme

## Classification

MINOR: add a selectable pixel-art theme to the web app, matching the existing Android Pixel theme.

## Goal

Add a web theme that uses the supplied 19 pixel icons and four frame sprites. Keep existing themes and their layout behavior unchanged. Reuse the Android Pixel palette: deep navy background, slate panels, cream text and borders, and crisp blue highlights.

## Design and implementation steps

1. Add `pixel` to the web theme preference type, stored-value normalization, and Settings theme picker.
2. Crop and preserve the supplied icon and frame artwork as independent transparent PNG assets for the web build.
3. Map the icons to their corresponding web controls and use the supplied nine-slice frames on panels, headers, and the composer.
4. Apply the Pixel palette, square controls, and pixel image rendering to the chat, sidebar, file tree, settings, pairing, menus, and dialogs; keep code and terminal text readable.
5. Keep all visual changes scoped to Pixel and add a preference persistence test.
6. Increment the web package development version and changelog as a MINOR feature.
7. Run the relevant test suite and production build; verify all referenced image assets exist.

## Acceptance criteria

- Pixel appears as a selectable theme and remains selected after reload.
- The web UI follows the Android Pixel palette and uses the supplied icon and frame artwork.
- The 19 icon sprites and all four frames are available as transparent image assets.
- Existing themes, old-theme layout, and standard icon rendering remain unchanged.
- Theme tests and the web production build pass.

## Completion — 2026-10-18

- Added the selectable Pixel theme as web version `0.45.0-dev.1`, using the Android palette and the supplied transparent icon/frame sprites.
- Verified all 19 icons and four frame PNGs are RGBA, and every CSS asset reference resolves.
- `pnpm build` passes; `node --test tests/themePreferences.test.mjs` passes (11/11).
- The full `pnpm test` run reports 115/120 passing. Its five failures are outside this theme change: a Node module-resolution failure in `codexRemoteClient.test.mjs` and four source-layout assertions in `multiPaneComposerLayout.test.mjs` whose expected source text is absent.

## Follow-up — Pixel theme typography and message frame

### Classification

PATCH: refine the existing Pixel theme without changing what users can do.

### Design and implementation steps

1. Remove the nine-slice outer frame from the operation log while retaining its existing content and accent divider.
2. Apply that `wide-window.png` frame to user message bubbles, preserving the distinct Codex and Claude surfaces.
3. Load the already licensed Fusion Pixel proportional Chinese font from the Android assets, include its OFL notice in the web distribution, and scope it to the web Pixel theme; keep code, file previews, and terminal output monospace for readability.
4. Increment the web development patch version and add a concise changelog entry.
5. Run the production build and relevant theme checks, confirming the font asset and license notice are emitted and referenced.

### Verification

- `pnpm build` passes and emits the Fusion Pixel TTF plus `public/pixel-theme/fonts/FusionPixel-OFL.txt` into `dist`.
- `node --test tests/themePreferences.test.mjs` passes (11/11).

## Follow-up — Pixel font fallback rendering

### Classification

PATCH: restore readable text in the existing Pixel theme on browsers that do not render the single-weight web font reliably.

### Design and implementation steps

1. Re-enable font-weight synthesis within Pixel theme roots because the bundled Fusion Pixel face only provides Regular while the app globally disables synthesis.
2. Add explicit platform Chinese and Latin fallback families without changing the Pixel theme's primary font.
3. Increment the web development patch version and add a concise changelog entry.
4. Run the production build, theme preference tests, and verify the served font resource and bundled fallback rules.

### Verification

- `pnpm build` passes and `node --test tests/themePreferences.test.mjs` passes (11/11).
- The local web service returns the bundled font with HTTP 200 and `Content-Type: font/ttf`.

## Follow-up — restore Pixel theme text visibility

### Classification

PATCH: restore readable text after the bundled web font rendered blank in the user's browser.

### Design and implementation steps

1. Remove the Fusion Pixel web-font integration and restore the previously visible monospace stack for Pixel theme UI text; leave Android font assets untouched.
2. Keep the Pixel palette, icons, frames, and user-message border unchanged.
3. Increment the web development patch version and add a concise changelog entry.
4. Run the production build and theme preference tests, confirming the web bundle no longer references the failing font asset.

### Verification

- `pnpm build` passes and `node --test tests/themePreferences.test.mjs` passes (11/11).
- Confirmed the rebuilt web CSS no longer references or emits the Fusion Pixel TTF; the Android font asset remains untouched.

## Follow-up — use a browser-compatible Pixel font

### Classification

PATCH: make the existing Pixel theme typography genuinely pixel-styled while preserving readable text and existing non-Pixel themes.

### Design and implementation steps

1. Validate the official Fusion Pixel Simplified Chinese WOFF2 release, its Chinese/Latin glyph coverage, and the included OFL license.
2. Render Chinese and Latin samples in the available headless Chromium browser and confirm the font loads and glyphs are visible before integrating it.
3. If browser rendering succeeds, bundle the validated WOFF2 assets and license, scope them to Pixel theme UI text, and keep code, file previews, and terminal output monospace.
4. Increment the web development patch version and add a concise changelog entry.
5. Run theme tests and the production build, then render the actual Pixel-themed web UI in Chromium to check that text remains visible.

### Verification

- Bundled the upstream Fusion Pixel 12px proportional Simplified Chinese WOFF2 release and the release's OFL/license notices; `font-display: swap` and system fallbacks keep text readable if the font cannot load.
- A Chromium rendering of Chinese and Latin sample text showed the font loaded successfully and visibly pixel-shaped glyphs.
- Rendered the built web app's Pixel-themed pairing screen in Chromium: all Chinese and Latin text remained visible and pixel-styled. The font URL returned HTTP 200 with `Content-Type: font/woff2`.
- Code blocks and terminal text remain explicitly monospace; other themes are unchanged.
- [x] Version `0.45.4-dev.1` and concise changelog entry added.
- [x] Pixel theme tests and production build passed.

## Follow-up — correct Pixel message frame and operation divider

### Classification

PATCH: fix existing Pixel theme decoration placement without changing chat behavior or other themes.

### Design and implementation steps

1. Hide the operation-log summary's blue divider only in the Pixel theme.
2. Raise the Pixel user-message selectors above the higher-specificity Codex/Claude surface rules so the frame applies to the message bubble in both modes.
3. Remove the decorative frame from message copy-action buttons; keep code-copy controls and other controls unchanged.
4. Increment the web development patch version and add a concise changelog entry.
5. Run Pixel theme tests/build and render both mode selectors in Chromium, confirming the user bubble has a frame, the message copy button does not, and the operation divider is absent.

### Verification

- Chromium computed a `9px wide-window` frame on user message bodies in both Codex and Claude modes, `0px` border on the message copy action, and `display: none` on the operation divider; the screenshot confirmed the visible result and theme-specific readable text.
- `node --test tests/themePreferences.test.mjs` and `pnpm build` pass.
- Version `0.45.5-dev.1` and changelog entry added.

## Follow-up — keep composer button frames stable on hover

### Classification

PATCH: fix Pixel composer button frames visibly changing while hovering between controls; retain the existing borders.

### Design and implementation steps

1. Keep the Pixel composer menu and send buttons on their existing `square-window.png` frame in both resting and hover/open states; only change the hover surface color.
2. Add a CSS regression assertion that the Pixel composer hover rules preserve the same frame and 8px border width.
3. Increment the web development patch version and add a concise changelog entry.
4. Run the theme preference test, production build, and `git diff --check`; verify computed border styles in the available browser if feasible.

### Verification

- `node --test tests/themePreferences.test.mjs` passes (14/14); the regression assertion checks both composer button bases retain an 8px `square-window.png` border and their hover rules keep that same frame.
- `pnpm build` and `git diff --check` pass. Browser automation packages are not installed in this workspace, so hover continuity is verified through the focused CSS regression assertion.
- Version `0.45.6-dev.1` and changelog entry added.

## Follow-up — enforce Pixel composer borders while hovering

### Classification

PATCH: restore the existing Pixel composer borders during hover/open states after the previous frame-stability fix did not prevent the border reset from winning in the rendered UI.

### Design and implementation steps

1. Add a higher-specificity Pixel composer footer rule that explicitly reapplies the 8px `square-window.png` border to hovered or open model, effort, authorization, attachment, stop, and send controls.
2. Extend the CSS regression assertion to require the explicit hover border as well as the stable frame.
3. Increment the web development patch sequence and add a concise changelog entry.
4. Run the theme preference test, production build, and `git diff --check`.

### Verification

- `node --test tests/themePreferences.test.mjs` passes (14/14), including the explicit hover/open 8px border regression assertion.
- `pnpm build` and `git diff --check` pass.
- Version `0.45.6-dev.2` and changelog entry added.
