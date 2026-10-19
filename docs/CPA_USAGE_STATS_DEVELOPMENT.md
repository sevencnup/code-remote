# CPA-Manager-Plus Token Usage Statistics

## Goal

Show token usage reported by the user's deployed CPA-Manager-Plus Manager Server inside Codex Remote. The Manager Server URL and its read credential are configured in the browser; requests go to that deployed host, not GitHub.

## Verified upstream contract

- CPA-Manager-Plus Full Mode persists request usage and exposes `POST /v0/management/monitoring/analytics`.
- The endpoint accepts a time range, browser time zone, and include flags for summary, timeline, model statistics, and account statistics. It uses `Authorization: Bearer <Manager admin key>`.
- The generated client API key used by Codex for model requests does not authorize this management endpoint.
- The analytics request accepts `filters.api_key_hashes` and supports `include.filter_options` / `include.filter_selectors`. The returned `filter_options.api_key_hashes` values are hashes suitable for selecting a caller key without exposing the key itself.
- The Manager UI's cached-token total is `cached_tokens + cache_read_tokens + cache_creation_tokens`; Codex Remote must use the same sum rather than displaying only `cached_tokens`.
- CPA-Manager-Plus Lightweight Panel does not include the persistent Manager Server analytics database.
- CLIProxyAPI's `/v0/management/usage-queue` endpoint pops queued events. Codex Remote must not read it directly because doing so consumes events that the Manager Server may need to persist.
- Token counts reflect usage data reported through CLIProxyAPI's usage events. They cannot reconstruct requests made before collection was enabled or fill token fields an upstream provider did not report. Costs, where shown, are CPAMP estimates based on its configured model prices.

## Implementation steps

1. [x] Add a prominent settings module for the deployed Manager Server base URL and Manager admin key, clearly distinguish it from the Codex client API key, and test the analytics endpoint before saving. Send the admin key only in the Authorization header and never in query strings or logs.
2. [x] Add an authenticated client for `POST /v0/management/monitoring/analytics`, including cancellation, actionable authorization/network/Full Mode errors, and cache-token aggregation matching the Manager UI.
3. [x] Add an in-app usage view with selectable recent ranges, totals, hourly/daily timeline, model breakdown, and account breakdown. Use upstream response values without estimating token counts in Codex Remote.
4. [x] Add a settings section for the API connection, plus refresh and empty/error states in the usage view. Make the endpoint configurable so deployments can use a domain and reverse-proxy path.
5. [x] Add a caller API key selector using an independent, unfiltered filter-options request. Send the selected hash in the main analytics request so summary, timeline, model, and account statistics all use the same filter; display only a short hash label.
6. [x] Show the API's `summary.total_cost` as USD with two decimal places and explain that the amount uses prices configured in Manager.
7. [x] Make the usage statistics content fill the available panel width.
8. [x] Make summary cards automatically choose the number of columns from the available width and reduce their numeric type size for desktop and mobile.
9. [x] Update package version and changelog as a PATCH improvement; build and review only the files changed for this feature before committing.

## Acceptance criteria

- A user can enter their deployed Manager Server URL and admin key, test the analytics connection, and see token statistics without putting the key in the URL. The module explains that the Codex client API key cannot authorize the management endpoint.
- The view presents summary token counts and upstream model/account statistics for today, 7 days, and 30 days; it does not call the destructive CLIProxyAPI queue endpoint.
- A caller API key can be selected without revealing its key; all displayed statistics and the amount use the selected key, while the selector options remain available.
- The amount is shown in USD using the Manager's configured model prices.
- The statistics cards, trend, and breakdowns use the available panel width.
- Summary cards change column count with the available width and keep their values legible at narrow sizes.
- Incomplete/missing provider usage is shown as reported data, not reconstructed estimates. A Lightweight Panel or unavailable history produces a clear explanation.
- URL prefixes, authorization failures, CORS/network failures, loading, empty data, and manual refresh are handled without disrupting chat.
- TypeScript/Vite production build succeeds and `git diff --check` is clean.
