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
