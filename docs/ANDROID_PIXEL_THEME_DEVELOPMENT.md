# Android Pixel Theme

## Classification

MINOR: add a selectable pixel-art interface theme to the Android app.

## Goal

Add a distinct Pixel theme inspired by the supplied retro chat-sidebar reference. Keep the existing themes, including Old Classic, unchanged. Extract the supplied icon sheet into reusable transparent PNG assets and use the matching icons only when Pixel is selected.

## Design and implementation steps

1. Add Pixel as a selectable Android theme and persist it through the existing theme preference.
2. Match the reference with a deep navy background, slate panels, cream and steel pixel borders, crisp blue highlights, and compact retro controls.
3. Crop the 19 supplied sprites into standalone transparent assets: search, refresh, chat, settings, connection, terminal, folder, add-file, send, pause, edit, confirm, delete, theme, display, language, notifications, matching, and about.
4. Map those assets to their corresponding Android controls while leaving all other themes on their current icon resources.
5. Apply pixel-theme typography and blocky surfaces consistently across the main chat, sidebars, settings, file tree, terminal, queues, and dialogs.
6. Update Android/package version metadata and the changelog for the new user-visible theme.
7. Verify the Android debug build, icon resources, theme selection/persistence, and that other theme branches remain unaffected.

## Acceptance criteria

- Pixel can be selected in Settings and remains selected after restarting the app.
- The Pixel theme covers the main app surfaces and settings, not only the sidebars.
- Each of the 19 supplied icon sprites is available as an independent transparent Android asset and appears in its matching action.
- Selecting another theme restores its existing colors and icons.
- The Android debug build completes successfully.

## Border asset follow-up

### Classification

PATCH: refine the existing Pixel theme with the supplied frame artwork.

### Implementation steps

1. Keep the four extracted frame sprites as independent transparent drawable assets.
2. Add a cached nine-slice drawable that stretches the frame edges while preserving the pixel corners.
3. Use the panel frame for cards, the square frame for compact controls, the strip frame for the header and composer, and the active frame for selected controls and the live activity row.
4. Keep the frame assets and their colors scoped to the Pixel theme.
5. Increment the Android patch sequence and changelog, then build the Android debug variant.

### Acceptance criteria

- Frame corners keep their pixel shape at narrow and wide view sizes.
- Panel, square, strip, and active frame assets appear in their intended Pixel theme surfaces.
- Existing non-Pixel theme branches retain their prior backgrounds.
- The Android debug build completes successfully.

## Pixel typography follow-up

### Classification

PATCH: improve the existing Pixel theme typography without changing its available tasks or controls.

### Implementation steps

1. Bundle the Fusion Pixel 12px proportional Simplified Chinese font from its official release, retaining the upstream OFL and source notices.
2. Use the pixel typeface for Pixel theme text and labels only; leave all other themes unchanged.
3. Preserve monospaced code rendering for alignment and readability.
4. Increment the Android patch sequence and changelog, then build the Android debug variant.

### Acceptance criteria

- Chinese and Latin UI text use a visibly pixel-styled font when the Pixel theme is active.
- Other themes and code block typography retain their existing typefaces.
- Font attribution and redistribution notices are included with the app assets.
- The Android debug build completes successfully.

## Pixel sidebar fidelity follow-up

### Classification

PATCH: refine the existing Pixel sidebar to better match the supplied design, without adding or removing user tasks. Target Android version: `0.44.0-dev.4` (`versionCode 284`).

### Design and implementation steps

1. Align the new-chat action with the reference's cream pixel surface, dark label, and green add glyph instead of reusing the bright Codex blue selected-action treatment.
2. Make the sidebar's header, selected conversation, and footer controls use the supplied pixel frames and icon artwork as one coherent visual system.
3. Tune conversation row scale, spacing, and text contrast for the reference's compact pixel layout while keeping touch targets usable.
4. Keep the changes scoped to the Pixel theme; leave Old Classic and other themes unchanged.
5. Increment the Android patch sequence and changelog, build a distinct debug APK, install it without opening the app, and verify the installed package version.

### Acceptance criteria

- The new-chat button uses the cream/dark/green treatment from the reference and no longer looks like a standard blue Codex action.
- Pixel sidebar controls and selected conversation use the supplied pixel frames consistently.
- Conversation labels remain legible and rows remain comfortable to tap.
- Other themes retain their prior sidebar appearance.
- The Android debug build succeeds and the installed package reports the new version.

### Completion

- Pixel's new-chat button now uses the cream frame, dark text, and original green plus artwork. The sidebar panel, selected chat, and compact controls use the supplied pixel frames; sidebar row sizing and footer icon scale were adjusted for the reference.
- Android debug build succeeded. The package was installed to `10.126.126.2:5555`; Package Manager reports `0.44.0-dev.4` / `versionCode 284`.
- The app was not opened during verification, so the device's foreground app was left undisturbed.

## Pixel font visibility and frame drawable follow-up

### Classification

PATCH: restore readable text in the existing Pixel theme and make pixel frame state changes safe. Target Android version: `0.44.0-dev.7` (`versionCode 287`).

### Design and implementation steps

1. Use Android's reliable monospace typeface for Pixel UI text while retaining the bundled pixel font asset until its rendering can be verified on device.
2. Keep the platform's default text paint flags so glyphs remain visible on the target phone.
3. Add a valid `Drawable.ConstantState` to the pixel nine-slice frame so Android can safely clone it in pressed and selected states.
4. Build and install a distinct APK, reopen the app, and inspect the actual device screen and logs for visible labels and drawable warnings.

### Acceptance criteria

- Chinese labels and conversation text render in Pixel theme; Latin text and numbers remain monospaced.
- Pixel frame state backgrounds clone safely without `LayerDrawable` ownership warnings.
- The Android build succeeds and the installed package reports `0.44.0-dev.7` / `versionCode 287`.

### Completion

- On-device screenshots confirmed the bundled Fusion Pixel face still hid text on the target phone after adding a system fallback. Pixel UI now uses Android's monospace face with default text paint flags; Chinese labels, conversation messages, and sidebar entries are visible.
- Added drawable constant state for pixel frames. The latest device log sample contains no invalid `LayerDrawable` ownership warnings.
- Debug build succeeded and `0.44.0-dev.7` / `versionCode 287` was installed and opened on `10.126.126.2:5555`; the chat and sidebar were visually checked.

## Pixel Chinese raster follow-up

### Classification

PATCH: make Chinese text in the existing Pixel theme visibly pixelated while keeping it readable. Target Android version: `0.44.0-dev.9` (`versionCode 289`).

### Design and implementation steps

1. Keep Android's visible system monospace/fallback typeface for Pixel UI text; do not restore the bundled font that disappeared on the target phone.
2. Render Pixel UI labels, user messages, and assistant Markdown through a low-resolution text surface, then enlarge it with nearest-neighbor sampling so Chinese glyphs have clear pixel edges.
3. Leave code blocks, terminal output, editable inputs, and all non-Pixel themes on their existing rendering paths.
4. Bound and invalidate any raster cache so scrolling and live activity updates do not retain unbounded bitmaps or show stale text.
5. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect Chinese and Latin text in the chat and sidebar on the target phone.

### Acceptance criteria

- Chinese Pixel-theme labels and chat messages visibly use blocky, nearest-neighbor edges and remain readable at normal phone scale.
- Latin labels receive the same Pixel-theme treatment; code blocks, terminal output, editable inputs, and other themes remain unchanged.
- The Pixel theme text remains visible on the target device and the raster cache stays bounded.
- The Android debug build succeeds and the installed package reports `0.44.0-dev.9` / `versionCode 289`.

### Completion

- Pixel-theme labels, sidebar entries, user text, and assistant Markdown now render at half resolution and use nearest-neighbor enlargement. Chinese and Latin characters have visible square edges while remaining legible on the phone.
- Code blocks, diff review text, terminal output, editable fields, and other themes keep their existing rendering. The bitmap cache is capped at 8 MiB and entries are invalidated when text or view state changes.
- Android debug build succeeded. `0.44.0-dev.9` / `versionCode 289` was installed on `10.126.126.2:5555`; screenshots of the chat and sidebar were visually checked. The captured log sample had no fatal exception, out-of-memory, or invalid drawable warnings.

## Pixel sidebar and header control sizing follow-up

### Classification

PATCH: correct clipped Pixel sidebar footer labels and icon sizing without changing navigation actions. Target Android version: `0.44.0-dev.10` (`versionCode 290`).

### Design and implementation steps

1. Give the three sidebar footer actions enough vertical room for both their icon and label, with clear label contrast.
2. Keep conversation-row chat glyphs inside their selected-row frame with a small inset.
3. Enlarge the main header's menu, terminal, and file-tree glyphs while keeping their button frames inside the header strip.
4. Keep other themes and all action behavior unchanged.
5. Increment the Android patch sequence and changelog, build a distinct APK, install it, and visually inspect the sidebar and header on the target phone.

### Acceptance criteria

- Sidebar footer shows Settings, Switch profile, and Reconnect labels below their icons without clipping.
- Conversation icons stay inside row frames; the menu, terminal, and file-tree icons are visibly larger and do not spill over the header frame.
- Other themes retain their current dimensions and the Android debug build succeeds with `0.44.0-dev.10` / `versionCode 290` installed.

### Device inspection note

- The `.10` build enlarged the header controls and inset the conversation glyph, but its three footer labels still did not render on the phone. The label issue is carried forward to the `.12` follow-up below.

## Pixel footer label visibility follow-up

### Classification

PATCH: make all three existing sidebar footer labels visible and keep the Pixel controls within their frames. Target Android version: `0.44.0-dev.12` (`versionCode 292`).

### Design and implementation steps

1. Inspect the installed `.11` build on the phone; its enlarged footer still does not render the three labels through the Pixel raster text view.
2. Render only the footer labels with Android's native text view, preserving the Pixel monospace face, palette, and enough height for each icon and label.
3. Preserve the existing Pixel artwork, action behavior, equal-width footer layout, and non-Pixel styling.
4. Keep the sidebar conversation glyph inset from its frame and retain the enlarged header menu, terminal, and file-tree controls.
5. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect the footer and header on the target phone.

### Acceptance criteria

- Settings, Switch profile, and Reconnect labels are readable below their icons on the Pixel theme.
- The conversation glyph remains inside its selected frame; enlarged header controls remain within the header strip.
- Other themes and footer actions behave as before, and the Android debug build succeeds with `0.44.0-dev.12` / `versionCode 292` installed.

### Completion

- The `.11` screenshot confirmed that increasing the footer height alone did not make its rasterized labels appear. In `.12`, those three labels use Android's native TextView drawing with the Pixel monospace face and palette; the icons and all actions remain unchanged.
- Android debug build succeeded, and `0.44.0-dev.12` / `versionCode 292` was installed on `10.126.126.2:5555`. The phone screenshot shows “设置”, “切换配置”, and “重连” beneath their icons; the selected chat glyph stays inside its frame and the top menu, terminal, and file-tree controls fit the header strip.

## Pixel sidebar, workspace footer, and queue contrast follow-up

### Classification

PATCH: correct Pixel-theme icon spacing, workspace paste control height, and queued-message text contrast. Target Android version: `0.44.0-dev.13` (`versionCode 293`).

### Design and implementation steps

1. Add inner spacing to the Pixel conversation row so its chat glyph clears the selected-row frame.
2. Give the workspace tree's bottom Paste action a taller Pixel touch target and frame so the label no longer touches the border.
3. Keep the white Pixel queue card and use dark, high-contrast text colors for its message, notice, and model/effort details.
4. Keep all three changes scoped to Pixel and preserve existing actions and other themes.
5. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect the three controls on the phone.

### Acceptance criteria

- The conversation chat icon has visible space from the selected-row frame.
- The workspace Paste button frame clears the label vertically.
- Queue text and metadata are legible on the light Pixel queue card.
- The Android debug build succeeds and `0.44.0-dev.13` / `versionCode 293` is installed on the target phone.

### Completion

- Pixel conversation rows now inset their contents by 8dp, putting the chat glyph clear of the selected frame. The workspace Paste action has a 38dp minimum height with vertical padding, and the light queue card uses dark message, notice, and metadata text.
- Android debug build succeeded, and `0.44.0-dev.13` / `versionCode 293` was installed on `10.126.126.2:5555`. The installed screenshot confirms the chat glyph no longer touches the selected frame.

## Android chat header title spacing follow-up

### Classification

PATCH: remove the workspace path subtitle from the chat header so the header space is devoted to the active chat title. Target Android version: `0.44.0-dev.14` (`versionCode 294`).

### Design and implementation steps

1. Keep the active conversation title in the header and remove its workspace-path subtitle.
2. Vertically center the title in the available header space after removing the subtitle.
3. Remove the now-unused workspace-path view update from header rendering.
4. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect the chat header on the target phone.

### Acceptance criteria

- The header shows the active chat title on one line with no workspace path beneath it.
- Header actions and other themes continue to render and operate as before.
- The Android debug build succeeds and `0.44.0-dev.14` / `versionCode 294` is installed on the target phone.

### Completion

- The workspace-path subtitle and its renderer update were removed; the chat title is vertically centered in the available header column. Long titles continue to use the existing one-line ellipsis behavior.
- Android debug build succeeded, and `0.44.0-dev.14` / `versionCode 294` was installed on `10.126.126.2:5555`. The device screenshot confirms the header no longer displays the path beneath the chat title.

## Android chat header long-title fit follow-up

### Classification

PATCH: let long chat titles shrink within a bounded range before applying the existing ellipsis, while keeping the path subtitle hidden. Target Android version: `0.44.0-dev.15` (`versionCode 295`).

### Design and implementation steps

1. Keep the current header title size for names that already fit.
2. Allow the title text to shrink by up to 8sp when the available header width is insufficient.
3. Preserve the existing one-line layout, title actions, and hidden workspace path.
4. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect a long chat title on the target phone.

### Acceptance criteria

- A long chat name uses a smaller readable size to fit the available header width before ellipsizing.
- Short chat names retain the current title size; the workspace path remains hidden.
- The Android debug build succeeds and `0.44.0-dev.15` / `versionCode 295` is installed on the target phone.

### Completion

- The title now auto-sizes down by up to 8sp before the existing ellipsis. The device screenshot showed the path remained hidden, but a long conversation name still exceeded the available one-line width; the follow-up below allows a second title line.
- Android debug build succeeded, and `0.44.0-dev.15` / `versionCode 295` was installed on `10.126.126.2:5555`.

## Android chat header wrapped-title follow-up

### Classification

PATCH: keep long chat names readable by allowing the header title to wrap to two lines while keeping the workspace path hidden. Target Android version: `0.44.0-dev.16` (`versionCode 296`).

### Design and implementation steps

1. Preserve the current title size and allow the active chat title to wrap to at most two lines.
2. Keep the path subtitle hidden and leave the header actions in place.
3. Keep ellipsis only for names that exceed both available lines.
4. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect the header with a long chat name on the target phone.

### Acceptance criteria

- Long chat names use up to two title lines instead of shrinking immediately to fit one line.
- Short names remain at the current size, and no workspace path appears below the title.
- The Android debug build succeeds and `0.44.0-dev.16` / `versionCode 296` is installed on the target phone.

### Completion

- The `.16` build allowed a second line but changed the intended single-line header. The user clarified that the chat title should match the sidebar brand title size, so this layout is superseded by the follow-up below.
- Android debug build succeeded, and `0.44.0-dev.16` / `versionCode 296` was installed on `10.126.126.2:5555`.

## Android chat header title size follow-up

### Classification

PATCH: restore a single-line chat title and match the sidebar brand title font size while keeping the workspace path hidden. Target Android version: `0.44.0-dev.17` (`versionCode 297`).

### Design and implementation steps

1. Keep the active chat title on one line and remove title auto-sizing or wrapping.
2. Use the same base font size as the sidebar brand title in the active theme.
3. Keep the workspace path hidden and preserve all header actions.
4. Increment the Android patch sequence and changelog, build a distinct APK, install it, and inspect the header and sidebar title sizes on the target phone.

### Acceptance criteria

- The chat title is one line and uses the same base font size as the sidebar brand title.
- The workspace path remains hidden and header actions continue to render.
- The Android debug build succeeds and `0.44.0-dev.17` / `versionCode 297` is installed on the target phone.

### Completion

- Restored a single-line title and matched the sidebar brand title's base size: 18sp for retro themes and 15sp for other themes. The workspace path remains hidden.
- Android debug build succeeded, and `0.44.0-dev.17` / `versionCode 297` was installed on `10.126.126.2:5555`.
