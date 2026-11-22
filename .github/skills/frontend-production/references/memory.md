# Memory: no leaks

A leak grows a tab's memory until it slows down or crashes. In a single-page app the tab never reloads, so every leak adds up: a dashboard left open all day, a trading screen, a TV app on a low-memory device. In React, one stray reference (a listener, a closure, a cache entry) can keep a whole unmounted component tree alive.

## Contents
- What leaks, and the fix
- Cleanup patterns
- Find a leak
- Keep it from coming back

## What leaks, and the fix

| Source | Fix |
|---|---|
| `addEventListener` on `window`, `document` or a long-lived element | Remove it in cleanup, or pass `{ signal }` from an `AbortController` and abort it |
| `setInterval`, `setTimeout`, `requestAnimationFrame` | `clearInterval`, `clearTimeout` or `cancelAnimationFrame` in cleanup |
| `ResizeObserver`, `IntersectionObserver`, `MutationObserver` | `disconnect()` in cleanup |
| `WebSocket`, `EventSource`, `BroadcastChannel`, `MessagePort` | `close()` in cleanup, and remove their handlers |
| Web Workers | `terminate()` when no longer needed |
| Camera, microphone, screen capture | `stream.getTracks().forEach((t) => t.stop())`, and clear `video.srcObject` |
| `fetch` | Abort with an `AbortController` on unmount, and ignore late answers |
| `URL.createObjectURL` (previews, downloads) | `URL.revokeObjectURL` once it's used or the preview closes |
| Chart, map, editor, video-player and date-picker instances | Call their `destroy()`, `dispose()` or `remove()` on unmount |
| `ImageBitmap`, `VideoFrame`, `AudioData` | `close()` once drawn or encoded |
| Canvases and WebGL | The library's `dispose()`; `gl.getExtension('WEBGL_lose_context')?.loseContext()`; set large canvases' size to 0 |
| Subscriptions to stores and event emitters | Unsubscribe in cleanup |
| Module-level caches and `Map`s that only grow | Cap them (LRU), expire entries, or use `WeakMap` when keyed by objects |
| Arrays that grow with live data (ticks, logs, chat) | A ring buffer with a fixed cap; trim what's displayed |
| A queue flushed by `requestAnimationFrame` | rAF pauses in hidden tabs while messages keep arriving: keep only the latest value per key, or cap the queue and resync when the tab returns |
| A query cache keeping every page ever visited | Keep the library's garbage-collection time; don't set it to infinity |
| Closures in long-lived callbacks capturing big objects | Capture only the ids or fields needed |
| Detached DOM: nodes removed from the page but still referenced | Drop the references (often a listener or a third-party instance) |
| `console.log` of large objects | DevTools keeps a reference while open; no `console.log` in committed code |

## Cleanup patterns

**One `AbortController` for everything an Effect starts:**

```tsx
useEffect(() => {
  const ac = new AbortController();
  window.addEventListener("resize", onResize, { signal: ac.signal });
  fetch(url, { signal: ac.signal }).then((r) => r.json()).then(setData).catch(ignoreAbort);
  const id = setInterval(poll, 30_000);
  const ro = new ResizeObserver(onSize);
  ro.observe(el);
  return () => { ac.abort(); clearInterval(id); ro.disconnect(); };
}, [url]);
```

**A third-party instance:**

```tsx
useEffect(() => {
  const chart = createChart(el, options);
  return () => chart.destroy(); // or dispose() or remove(): check the library
}, []);
```

- **One owner per resource.** Whatever creates it destroys it.
- **React runs Effects twice in development,** precisely to expose missing cleanup. If something breaks or doubles in dev, fix the cleanup; don't turn Strict Mode off.

## Find a leak

1. **Watch the trend:**
   - Chrome DevTools, Performance monitor: JS heap size, DOM nodes, JS event listeners.
   - Repeat the suspect action 10–20 times: open and close a dialog, navigate away and back.
   - After a forced garbage collection (the Collect garbage button in the Performance or Memory panel), a healthy app returns near its baseline. A sawtooth is normal; low points that climb after each round are a leak.
2. **Compare three snapshots:**
   - Memory panel, heap snapshot: take a baseline, repeat the action, take one, repeat it again, take another.
   - View "Objects allocated between snapshots", and filter by `Detached` for DOM nodes.
   - Follow the **retainers** path to the listener, timer, closure or cache holding it.
3. **Automate it with memlab** (Meta). It runs a scenario (go to the page, act, go back) in headless Chrome, diffs the heap snapshots, and reports leaked objects and their retainer traces, with React fibers in mind.
4. **Run a long session:** leave a dashboard open for at least 1 hour, and a real-time screen for 4–8 hours, with live data, and chart its heap. Real-time apps leak through buffers and subscriptions, which short tests miss.

## Keep it from coming back

- **Lint:** `react-hooks/exhaustive-deps` as an error. The audit script flags listeners, `setInterval`s, observers, sockets, workers and object URLs with no cleanup in the same file; check `setTimeout` and `requestAnimationFrame` loops by hand.
- **Review:** every `useEffect` that starts something has a return that stops it.
- **CI, for long-lived apps:** a memlab or Playwright scenario that repeats key flows and fails when memory keeps growing.

Sources: [MemLab](https://facebook.github.io/memlab/) · [Meta: MemLab announcement](https://engineering.fb.com/2022/09/12/open-source/memlab/) · [Chrome DevTools: fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) · [Front-End Checklist: memory leaks](https://frontendchecklist.io/rules/javascript/memory-leaks) · [Kustomer case study](https://medium.com/kustomerengineering/optimizing-memory-usage-in-single-page-apps-a-kustomer-case-study-de81ca9b105a)
