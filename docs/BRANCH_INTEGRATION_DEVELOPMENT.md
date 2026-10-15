# Branch Integration Development

## Goal

Integrate the eight local commits on [31mmain[0m with the 29 newer commits on [31morigin/main[0m, preserving both histories and all user-facing behavior.

The merged branch restores Windows Codex app-server history sharing and retains the newer remote browser history sync, activity timeline, and system notifications. This adds user-facing capability, so the integrated prerelease is 0.12.0-dev.1. Android versionCode stays unchanged because this merge does not create a new APK.

## Plan

1. Create a merge commit so the local and remote commit histories remain intact.
2. Resolve conflicts by comparing each side's behavior and combining compatible changes; do not replace whole files with either branch's version without review.
3. Reconcile version metadata and changelog ordering against the latest remote branch.
4. Inspect the complete merge diff, run whitespace/conflict-marker checks, and confirm only intended files changed.
5. Commit the integration locally, then push [31mmain[0m to [31morigin[0m as explicitly requested.

## Conflict review checklist

- [31mCHANGELOG.md[0m: retain remote entries and local entries in newest-first order.
- [31mandroid/app/build.gradle[0m and [31mpackage.json[0m: retain the latest version and monotonic Android version code.
- [31mserver/codex_remote/app.py[0m and [31msrc/components/CodexRemotePage.tsx[0m: combine API, runtime, and UI changes from both branches.
- Inspect app-server/history files and tests for changes that were refactored upstream after the local commits.

## Validation

- [31mgit diff --check[0m reports no whitespace errors or conflict markers.
- Confirm the merge commit has both the current [31morigin/main[0m and local [31mmain[0m as parents.
- Do not rewrite or force-push remote history.
