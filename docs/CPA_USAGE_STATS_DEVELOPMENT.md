# CPA-Manager-Plus Token Usage Statistics

## Goal

Show token usage reported by the user's deployed CPA-Manager-Plus Manager Server inside Codex Remote. The Manager Server URL and its read credential are configured in the browser; requests go to that deployed host, not GitHub.

## Verified upstream contract

- CPA-Manager-Plus Full Mode persists request usage and exposes `POST /v0/management/monitoring/analytics`.
- The endpoint accepts a time range, browser time zone, and include flags for summary, timeline, model statistics, and account statistics. It uses `Authorization: Bearer <management key>`.
- CPA-Manager-Plus Lightweight Panel does not include the persistent Manager Server analytics database.
- CLIProxyAPI's `/v0/management/usage-queue` endpoint pops queued events. Codex Remote must not read it directly because doing so consumes events that the Manager Server may need to persist.
- Token counts reflect usage data reported through CLIProxyAPI's usage events. They cannot reconstruct requests made before collection was enabled or fill token fields an upstream provider did not report. Costs, where shown, are CPAMP estimates based on its configured model prices.

## Implementation steps

1. [x] Add browser-local configuration for the deployed Manager Server base URL and Manager key, with an explicit connection check. Send credentials only in the Authorization header and never in query strings or logs.
2. [x] Add an authenticated client for `POST /v0/management/monitoring/analytics`, including cancellation and actionable authorization/network/Full Mode errors.
3. [x] Add an in-app usage view with selectable recent ranges, totals, hourly/daily timeline, model breakdown, and account breakdown. Use upstream response values without estimating token counts in Codex Remote.
4. [x] Add a settings section for the API connection, plus refresh and empty/error states in the usage view. Make the endpoint configurable so deployments can use a domain and reverse-proxy path.
5. [x] Update package version and changelog as a MINOR feature; build and review only the files changed for this feature before committing.

## Acceptance criteria

- A user can enter their deployed Manager Server URL and key, check the connection, and see token statistics without putting the key in the URL.
- The view presents summary token counts and upstream model/account statistics for today, 7 days, and 30 days; it does not call the destructive CLIProxyAPI queue endpoint.
- Incomplete/missing provider usage is shown as reported data, not reconstructed estimates. A Lightweight Panel or unavailable history produces a clear explanation.
- URL prefixes, authorization failures, CORS/network failures, loading, empty data, and manual refresh are handled without disrupting chat.
- TypeScript/Vite production build succeeds and `git diff --check` is clean.
