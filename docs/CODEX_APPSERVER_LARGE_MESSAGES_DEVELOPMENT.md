# Codex App Server large message handling

## Goal

Keep Codex Remote connected when Codex App Server returns a large JSONL message for a long conversation.

## Findings

- The app-server stdio reader is configured with a 64 MiB line limit.
- The running service logged `asyncio.LimitOverrunError` while reading one app-server line, then marked the app-server disconnected. Sending through the queue subsequently returned HTTP 503.
- The Windows WebSocket transport also caps individual messages at 64 MiB.

## Implementation steps

1. [x] Define one documented maximum app-server message size of 256 MiB.
2. [x] Apply it to both stdio and WebSocket transports so large conversation reads have the same allowance.
3. [x] Record the user-visible fix as a PATCH release and update the package version and changelog.
4. [x] Review the diff and restart the local Codex Remote service to load the fix.

## Validation

- Do not resend the failed message as part of validation; its delivery outcome may be uncertain.
- [x] Confirm the service starts; `GET /health` returned `200 OK` after restart.
- The app-server starts when a paired browser WebSocket reconnects. No paired WebSocket had connected yet during the post-restart log check, so the conversation-read path still needs that reconnect to be observed.
- No test suite is required for this operational incident fix.
