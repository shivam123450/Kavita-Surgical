# Resilience and observability

## Contents
- Errors and the four states
- Requests: timeouts, aborts, retries
- Real-time connections (WebSocket, SSE)
- Long-lived tabs
- Monitoring

## Errors and the four states

1. **Every data view has loading, empty, error and no-access states** (components.md).
2. **Error boundaries per area,** so one broken widget doesn't blank the app. Errors thrown in plain event handlers, timers or promises outside a React Action never reach a boundary, so report them yourself (in React 19, errors in a Transition or form `action` do).
3. **A lost connection gets a plain message, and typed work stays.** Turn the browser's own text ("Failed to fetch", "Load failed", "NetworkError…") into words a user understands:
   - "Couldn't reach the server. Check your connection and try again."
   - For a write, add: "This may not have been saved."
4. **Show the API's error text as it is.** Don't invent messages for errors it already explains.

## Requests: timeouts, aborts, retries

1. **Every request has a time limit,** each shorter than the one waiting on it (browser > proxy > server), so the most specific error arrives first.
2. **A request can be aborted** (`AbortController`) when its component unmounts or newer input supersedes it. A request aborted because newer input replaced it or its component unmounted is ignored; a timeout is shown as an error. Tell them apart by which signal fired.
3. **Writes are never retried automatically:** one that timed out may have gone through. Retrying is safe only with an idempotency key the server honours. Reads may retry transient failures (network errors, 408, 429 respecting `Retry-After`, 5xx) with a growing delay and a limit; give TanStack Query a `retry` function so a 4xx fails at once.
4. **Conflicting edits are caught:** each save sends a version or `updatedAt`, and a conflict is shown, never overwritten.
5. **API changes are additive.** Old tabs and rolled-back frontends keep working against today's API.

## Real-time connections (WebSocket, SSE)

1. **Choose the simplest transport that is fast enough:**
   - polling for updates every few seconds or slower;
   - Server-Sent Events for one-way server pushes, over HTTP/2 or 3 (HTTP/1.1 allows only 6 connections per domain across all tabs);
   - WebSocket for two-way traffic or high frequency.
2. **Reconnect with exponential backoff and full jitter:** a random delay between 0 and min(cap, base × 2ⁿ), with a base of about 0.5–1 s and a cap of about 30 s. Reset the counter once the connection proves healthy (first message, or about 30 s up). Set a flag before closing it yourself and don't reconnect when it's set; decide by the flag, not the close code. On each reconnect, use a fresh token and re-send every subscription.
3. **Reconnect at once,** without waiting out the backoff, when the browser goes back online or the tab or app becomes visible again.
4. **Use a heartbeat.** A connection that has gone silent past its expected ping interval is dead: close it and reconnect.
5. **Resume or resync:**
   - send the last sequence number processed, so the server replays what was missed;
   - if it can't, throw away local state and rebuild from a fresh snapshot;
   - detect gaps in sequence numbers and resync on any gap;
   - after reconnecting, cross-check critical state over REST.
6. **Show the connection state:** live, reconnecting, or offline with the time of the last update. **Never show stale data as live.**
7. **One connection per app, not per component.** Share it across tabs where that matters: a `SharedWorker` where supported, otherwise one leader tab chosen with the Web Locks API that relays over `BroadcastChannel`.
8. **Close the connection on unmount or sign-out,** and cap any buffer of incoming messages (memory.md).

## Long-lived tabs

- **Refresh data after writes.** Pause polling while the tab is hidden, and catch up when it is shown again.
- **Version skew:** after a deploy, an open tab runs old code. Use the framework's deployment id (Next's `deploymentId`) or the host's skew protection, and reload on the next navigation. Keep the previous build's static files online for at least a day, and reload once on a failed chunk load.
- **A session that ends mid-work** sends the user to sign in and brings them back, with drafts kept under that user's id and restored only for the same user (wiped at an explicit sign-out).
- **Work with the back/forward cache:**
  - no `unload` listener;
  - `beforeunload` only while there are unsaved changes;
  - save drafts on `pagehide` and `visibilitychange`.

## Monitoring

1. **Errors from the browser and the server** go to an error tracker, tagged with the release id. Source maps are uploaded privately.
2. **A report says how the user got there:** recent routes, without query strings. The user sees a reference they can quote.
3. **Collect real users' Core Web Vitals,** and CSP violation reports.
4. **Domain metrics where they matter:** video startup time and rebuffering, real-time message lag, payment step drop-off.
5. **No personal data in any report** (security.md).

Sources: [WebSocket reconnection guide](https://websocket.org/guides/reconnection/) · [Kraken: WebSocket reconnection](https://docs.kraken.com/exchange/guides/websockets/reconnection) · [web.dev offline UX](https://web.dev/articles/offline-ux-design-guidelines) · [Page lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api) · [Vercel Skew Protection](https://vercel.com/docs/skew-protection)
