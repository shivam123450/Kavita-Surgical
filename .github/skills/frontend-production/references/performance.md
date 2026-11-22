# Performance

## Contents
- Targets
- Measure first
- Loading: LCP
- Stability: CLS
- Interaction: INP and long tasks
- Rendering in React
- High-frequency updates
- Network and caching
- Budgets in CI

## Targets

Each is met at the 75th percentile of real page loads, on mobile and on desktop:
- **LCP** (largest contentful paint) ≤ 2.5 s;
- **INP** (interaction to next paint) ≤ 200 ms;
- **CLS** (cumulative layout shift) ≤ 0.1.

A long task is anything that blocks the main thread for more than 50 ms.

## Measure first

1. **In the lab:** a production build (never the dev server), then Lighthouse with mobile throttling. For INP, use the Chrome DevTools Performance panel while clicking and typing through the screen.
2. **Find the cause:**
   - the React Profiler for re-renders;
   - the Performance panel for long tasks;
   - a bundle analyzer for what's in each chunk.
3. **In the field:** the `web-vitals` library (or the framework's hook) reports real users' metrics, with the release id. Lab numbers don't replace these.
4. **Fix the biggest cause, then measure again.** Never optimise blind.

## Loading: LCP

1. **No request waterfalls.** Independent requests run in parallel, and the data the first view needs is fetched on the server or preloaded.
2. **Ship less JavaScript.**
   - Use server components.
   - Split code by route.
   - Load heavy, rarely used parts (editors, charts, maps, players, dialogs, the command palette) with `import()` or `next/dynamic`.
   - Use native methods instead of utility libraries, and import only what you use.
3. **The LCP image** is sized, never lazy, and has `fetchpriority="high"` (Next.js: `preload` or `fetchPriority`; `priority` is deprecated). Preload it only if it is the LCP at every screen width. Images below the fold are lazy; images in the first viewport, at any width, are not.
4. **Images:**
   - AVIF or WebP, through the framework's image component or a CDN;
   - responsive `srcset` and `sizes`;
   - never larger than they're displayed.
5. **Fonts:**
   - self-hosted through the framework's font loader, which adds a size-matched fallback;
   - subset, with at most two families;
   - `font-display: swap`;
   - only the critical one preloaded.
6. **Third-party scripts** load after the page is interactive, or on interaction, each with a reason. Every tag is paid for in INP and LCP.
7. **CSS:** one small critical path. Don't block rendering on CSS that is used only below the fold.

## Stability: CLS

- **Images and embeds have dimensions,** or an `aspect-ratio`.
- **Skeletons match the final layout** in height and columns.
- **Late content** (banners, cookie notices, ads) reserves its space or is fixed-position.
- **Fonts swap without reflow** (the size-matched fallback).
- **Anything stamped before first paint** (theme, sidebar width) is set by an inline script or on the server, never in an Effect.
- **Animate only `transform` and `opacity`,** never `width`, `height`, `top` or `left`.

## Interaction: INP and long tasks

1. **Keep event handlers short.** Do the visible update first, then defer the rest:
   - `startTransition` for non-urgent React updates;
   - `useDeferredValue` for a value derived from typing;
   - `scheduler.yield()` between chunks of heavy work, with a `setTimeout(0)` fallback where it isn't supported (Safari).
2. **Move CPU-heavy work** (parsing, sorting large arrays, crypto, image processing) to a Web Worker. Only DOM work has to stay on the main thread. Comlink makes workers easy to call.
3. **Never render an unbounded list.** Cap what's shown, and search on the server past that.
4. **Avoid layout thrashing:** read layout (`getBoundingClientRect`, `offsetHeight`) and then write styles, never alternating in a loop.
5. **`content-visibility: auto`** with `contain-intrinsic-size: auto <height>` skips rendering work for off-screen sections (without the size, the scrollbar jumps).

## Rendering in React

1. **Keep the re-render small:**
   - typing in one row re-renders that row, not the table;
   - `memo` list items and give them stable callbacks (`useCallback`, a reducer's `dispatch`);
   - keep per-item calculations inside the item.
2. **Use `useMemo` and `useCallback` where they pay:** an expensive calculation, or a value passed to a memoized child or an Effect. If the React Compiler is on, let it do this, after measuring that it helps.
3. **Use `Map` or `Set` for repeated lookups,** not `find` inside a loop. Sort a copy (`toSorted`).
4. **Context updates re-render every consumer.** Split contexts by how often their values change, or use a store with selectors (`useSyncExternalStore`, Zustand). Memoize the provider's `value` unless the React Compiler does; an inline object re-renders every consumer.
5. **`key` is the record's id.** Never put a number before `&&` in JSX: `{0 && …}` renders "0".

## High-frequency updates

This applies to live prices, telemetry, chat floods and sensor data (more in app-types/trading-realtime.md):

- **Keep only the latest value per key (conflate) in a mutable store,** and flush to React at most once per animation frame, or per widget at a rate people can perceive (100–500 ms).
- **Each cell subscribes to its own slice of data** (selectors, `useSyncExternalStore`, signals), so one update doesn't re-render the whole table.
- **Dense, fast visuals** (order books, depth charts, streaming charts) draw on canvas or WebGL, not thousands of DOM nodes.
- **Pause or slow updates while the tab is hidden** (`visibilitychange`).

## Network and caching

- **HTTP caching:** static assets get hashed file names with `Cache-Control: public, max-age=31536000, immutable`. HTML is revalidated (`no-cache`, plus `private` when personalized); API responses with a user's data get `private, no-cache`. Use `no-store` only for sensitive data.
- **Compression and protocols:** Brotli or gzip, HTTP/2 or HTTP/3, and a CDN for static files.
- **Warm up early:** `preconnect` to the one or two critical third-party origins, and prefetch likely next pages (link prefetch, or speculation rules as an enhancement).
- **Keep pages eligible for the back/forward cache:** no `unload` listener; `beforeunload` only while there are unsaved changes; no `no-store` on the document except sensitive pages; close WebSocket and IndexedDB connections on `pagehide`.

## Budgets in CI

- **Each route has a budget** for JavaScript and CSS, and CI fails when a build exceeds it.
- **Lighthouse CI** runs on key pages, and CI fails on a regression.
- **Real-user metrics** are reviewed after each release, and a regression is treated as a bug.

Sources: [Web Vitals](https://web.dev/articles/vitals) · [Optimize INP](https://web.dev/articles/optimize-inp) · [Optimize long tasks](https://web.dev/articles/optimize-long-tasks) · [Optimize LCP](https://web.dev/articles/optimize-lcp) · [Optimize CLS](https://web.dev/articles/optimize-cls) · [bfcache](https://web.dev/articles/bfcache) · [Performance budgets](https://web.dev/articles/performance-budgets-101) · [Vercel React best practices](https://github.com/vercel-labs/agent-skills)
