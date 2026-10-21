# Restore CPA Usage Before Shared Settings

## User visible change and version

- Category: MINOR. CPA connection settings return to browser-local storage and analytics requests return to the browser-to-Manager path, removing the cross-device shared connection added later.
- Target version: `0.59.0-dev.1`.
- Scope is limited to CPA usage settings and requests. Preserve unrelated chat, group chat, sidebar, Android, and workspace changes made after `5b38e6d`.

## Goal

Restore CPA usage behavior from `5b38e6d`: store the Manager URL and management key in the current browser, send analytics requests directly to the Manager endpoint, and keep the existing token filters and cost/statistics UI from that revision.

## Steps

1. [x] Restore the CPA settings card, analytics panel, and CPA client helper to their `5b38e6d` implementations.
2. [x] In `CodexRemotePage`, remove only shared CPA settings loading/migration state and restore browser-local settings persistence.
3. [x] Remove only CPA proxy routes and their supporting imports/model/store wiring from the backend. Preserve all unrelated backend and shared-state behavior.
4. [x] Remove CPA-specific API client methods and shared-settings-only CSS while keeping unrelated changes in those files.
5. [x] Update the changelog and package version, review the focused diff, and create a local commit. Do not push to GitHub.

## Data note

The shared-settings migration removed the previous browser-local copy after saving it on the server. Returning to browser-local settings means the user must enter the Manager URL and management key again in each browser that needs CPA statistics.

## Verification

- [x] Confirm CPA analytics uses the browser fetch path with the Manager Bearer header.
- [x] Confirm no CPA settings or analytics proxy routes remain in the Codex Remote backend.
- [x] Confirm only CPA-specific hunks were reverted and unrelated work remains intact.
- Do not run tests unless the user requests testing.
