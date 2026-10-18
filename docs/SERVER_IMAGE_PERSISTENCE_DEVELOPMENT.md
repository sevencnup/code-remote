# Server Chat Image Persistence

## Classification

PATCH: preserve the existing chat image preview behavior after the server restarts.

## Goal

Keep uploaded Codex chat images in the server's private application data directory so thread history can still render them after a service restart. Keep temporary PDF uploads and per-turn staging files disposable.

## Steps

1. Create a stable, private image store beside the server's existing state files.
2. Save Codex turn images there with restrictive file permissions and a 2 GB total storage quota.
3. Keep image enrichment and preview access scoped to that store; do not broaden arbitrary absolute-path access.
4. Keep PDF and Claude per-turn staging in a separate disposable directory and remove it at shutdown.
5. Update the server/package patch version and changelog.
6. Verify image reads across two app instances using the same state directory and check existing server test coverage.

## Acceptance criteria

- An uploaded Codex image remains readable after constructing a new app instance with the same state directory.
- Image paths outside the managed image store remain rejected.
- Reaching the 2 GB image storage quota rejects new image uploads without deleting existing chat images.
- Temporary PDF/per-turn files are still removed with the app's disposable runtime directory.
