# Trading and high-frequency real-time data (live prices, monitoring, IoT, sports scores)

Messages arrive faster than anyone can read them, and faster than React should render. The rules: decouple receiving from drawing, never show stale data as live, and never leak.

## Contents
- From the network to the screen
- Rendering
- Correctness of live data
- Numbers and time
- Order entry
- Testing

## From the network to the screen
1. **Receive in a Web Worker.** It holds the WebSocket, parses messages (a schema-compiled binary format such as Protobuf cuts size and often decode time; MessagePack mainly saves bytes, so measure), checks sequence numbers, and merges deltas into the order book. The main thread only draws.
2. **Conflate, then flush on a timer people can perceive.** Keep only the latest value per instrument in a mutable store (a `Map`), written at full speed; a queue would grow while a hidden tab pauses `requestAnimationFrame`. Flush to the UI once per animation frame, or per widget every 100–500 ms. Render cost then stays the same however fast messages arrive.
3. **One connection per app, shared across tabs:** a `SharedWorker` where supported (mobile may kill it in the background), otherwise a leader tab chosen with the Web Locks API relaying over `BroadcastChannel`, and subscribed only to the instruments that are on screen. Unsubscribe when they leave.
4. **Slow down or pause while the tab is hidden.** On return, resync from a snapshot instead of replaying a backlog.

## Rendering
- **React for the shell; canvas or WebGL for dense, fast visuals:** order book ladders, depth charts, streaming candles. Use TradingView Lightweight Charts or uPlot (libraries.md). Lightweight Charts' licence requires TradingView attribution: keep its `attributionLogo` on, or credit it on an About page.
- **Tables of live rows:**
  - virtualized;
  - each cell subscribed to its own instrument through a selector (`useSyncExternalStore`, Zustand selectors, signals), so one tick doesn't re-render the table;
  - rows memoized, with stable keys.
- **Flash a change** with a short CSS animation and an arrow, never colour alone, at most once per ~350 ms per cell (nothing flashes more than 3 times a second). Respect reduced motion.
- **Cap everything that grows:** chart history, the trade tape, log panes. Use ring buffers (memory.md).

## Correctness of live data
- **Sequence numbers on every message.** On a gap or checksum mismatch, resync: keep buffering live deltas, fetch a snapshot, drop buffered deltas at or below the snapshot's sequence, then apply the rest.
- **After a reconnect,** resync, and cross-check positions and orders over REST (resilience.md, "Real-time connections").
- **Show how fresh the data is:** live, delayed, reconnecting, the last update time, and a clear stale state (greyed prices, a banner). **Never show stale prices as live.**
- **Correct the clock:** measure the offset between server and client clocks, and show times from the server.

## Numbers and time
- **Prices and quantities arrive as decimal strings or integers in instrument units.** Format them to each instrument's tick size and decimal places; never round with floating point.
- **Tabular figures, aligned on the decimal point.** The locale's grouping applies to quantities, not inside price ladders if traders expect fixed formats.
- **Show the market's time zone,** and market status: open, closed, halted, pre-market.

## Order entry
- **Every order carries a client order id** (an idempotency key). The submit button locks once the request starts. The state shown comes from the server: pending, acknowledged, partially filled, filled, rejected (with the reason), cancelled.
- **Confirm, scaled to risk.** A confirmation step by default; one-click trading only when the user turns it on, with clear limits.
- **Keyboard shortcuts for speed,** each needing a deliberate combination. Never fire an order from one stray key.
- **Prevent fat-finger errors:** quantity and price sanity checks against market price and limits, with a warning that needs explicit confirmation.

## Testing
- **Record a real feed and replay it at 1×, 10× and 100×** in tests. Assert that frames stay under budget (no long tasks above 50 ms) and that the book stays correct.
- **Chaos-test the connection:** drop it, delay it, reorder messages, skip sequence numbers. Assert a resync and the stale indicators.
- **Run a session of 4–8 hours with live data,** and check that the heap stays flat (memory.md).

Sources: [WebSocket reconnection guide](https://websocket.org/guides/reconnection/) · [Kraken: WebSocket reconnection and order books](https://docs.kraken.com/exchange/guides/websockets/reconnection) · [Real-time trading dashboard notes](https://www.harshmittal.dev/build/realtime-trading-dashboard) · [Order-book render engine with Web Workers](https://github.com/morteza-front-end/orderbook-render-engine) · [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
