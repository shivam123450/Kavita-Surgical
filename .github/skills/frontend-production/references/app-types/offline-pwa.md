# Offline-first apps and PWAs (field apps, poor connections)

## Service worker
- **Use Workbox; don't hand-write caching logic.** Choose a strategy per resource:
  - cache-first for hashed static files;
  - network-first, with a cache fallback, for HTML;
  - stale-while-revalidate for data that can be a little old.
- **Have an update plan before shipping one.** A new worker waits; the app shows "Update available. Reload", and reloads when the user agrees. Never let users get stuck on an old version.
- **Never cache personal API responses** in a cache another user of the same device could read. Clear all caches and storage at sign-out.

## Data and writes
- **Store data in IndexedDB** (Dexie), with a schema version and migrations.
- **Writes made offline go into an outbox,** each with an idempotency key and a timestamp. Sync when the app comes back online or becomes visible (Background Sync where supported, with this as the fallback).
- **Plan conflicts:** last-write-wins only for fields where that's acceptable. Otherwise use versions with a resolution screen, or a CRDT (Yjs) for collaborative content.
- **Show sync state everywhere it matters:** offline, items waiting to sync, last synced time, and failed items with a retry.

## Storage limits
- **Ask for persistent storage** (`navigator.storage.persist()`) for data that matters, and check the quota (`navigator.storage.estimate()`).
- **Browsers can evict website storage.** Safari may clear storage for sites the user hasn't visited for some days unless the app is installed to the home screen. Never make the device the only copy of important data: sync it.
- **Don't keep secrets on the device.** Any personal data kept offline is minimal, expires, and is wiped at sign-out.

## Installability
- **A web app manifest:** `id`, `name`, `short_name`, icons at 192 and 512 px plus separate `purpose: "maskable"` icons, `start_url`, `display: "standalone"`, `theme_color` and `background_color`.
- **Installed apps lack browser controls:** every screen needs navigation and a way back.
- **Ask for permissions** (notifications, location, camera) in context, never on first launch.

## Testing
- **Test offline, flaky and switching networks:** `context.setOffline()`, plus a Chromium CDP session (`Network.emulateNetworkConditions`) or `page.route` delays and aborts.
- **Test a version update** with a populated cache and a pending outbox.
- **Test sign-out on a shared device:** nothing is left in caches, IndexedDB or storage.

Sources: [Workbox](https://developer.chrome.com/docs/workbox) · [web.dev offline UX](https://web.dev/articles/offline-ux-design-guidelines) · [Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle) · [MDN Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [Dexie](https://dexie.org/)
