# Server Chat Image Persistence

## Classification

MINOR: add a 90-day retention policy for persisted chat images.

## Goal

Keep uploaded Codex chat images in the server's private application data directory for up to 90 days so thread history can render them after a service restart. Keep temporary PDF uploads and per-turn staging files disposable.

## Steps

1. Create a stable, private image store beside the server's existing state files.
2. Save Codex turn images there with restrictive file permissions and a 2 GB total storage quota.
3. Remove stored images after 90 days, both at startup and periodically while the service runs.
4. Keep image enrichment and preview access scoped to that store; do not broaden arbitrary absolute-path access.
5. Keep PDF and Claude per-turn staging in a separate disposable directory and remove it at shutdown.
6. Update the server/package patch version and changelog.
7. Verify persistence, expiry cleanup, and existing server behavior.

## Acceptance criteria

- An uploaded Codex image remains readable after constructing a new app instance with the same state directory.
- Images older than 90 days are deleted and no longer embedded in chat history.
- Image paths outside the managed image store remain rejected.
- Reaching the 2 GB image storage quota rejects new image uploads without deleting existing chat images.
- Temporary PDF/per-turn files are still removed with the app's disposable runtime directory.
