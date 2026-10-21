# Mobile chat history loading state

## Goal

Keep the active-turn status from appearing by itself while a mobile conversation is still loading, and show the loading indicator in the center of the message area.

## Steps

1. Hide the running-status block until history loading finishes.
2. Center the standalone history-loading indicator horizontally and vertically in the message area for every theme.
3. Bump the current development version, record the user-visible change, run the production build and `git diff --check`, then commit only this change.

## Acceptance

- While an empty conversation is loading, the message area shows only a centered spinner and “正在加载对话…”.
- Once history is loaded, messages and any active-turn status appear together.
- The existing loading UI in other parts of the app remains unchanged.

## Verification

- `pnpm build` completed successfully.
- `git diff --check` completed successfully.
- No automated tests were run.
