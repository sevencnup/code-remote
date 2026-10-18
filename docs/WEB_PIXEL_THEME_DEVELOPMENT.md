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
