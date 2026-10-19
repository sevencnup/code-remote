# Android Chat Copy Actions Development

## Goal

Make copying discoverable in the Android chat UI: each fenced code block gets its own copy control, and each user or assistant message gets a message copy control.

## Steps

1. Add one clipboard helper that copies plain text and reports success through the existing localized toast.
2. Render assistant Markdown as Markdown text segments plus dedicated fenced-code cards. Keep language labels, code selection, and code copy scoped to each block. Use the same renderer for streamed assistant timeline segments.
3. Add a compact copy action below each textual user and assistant message, aligned with its message side. Copy the original message text, including Markdown syntax.
4. Add English labels for the new controls and record this user-visible feature/version.
5. Compile the Android debug app and inspect the diff. Keep the generated APK as a new versioned artifact; do not install it unless the user asks.

## Release classification

New feature / MINOR: users gain direct copy actions for individual code blocks and whole chat messages.

## Completion

- `:app:assembleDebug` completed successfully.
- APK: `artifacts/codex-remote-android-0.39.0-dev.1-debug.apk` (`versionCode` 280).
- Installation could not run because ADB reported no connected devices. The ADB server started for the check was stopped afterward.
