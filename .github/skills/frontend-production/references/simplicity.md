# The simplest thing that works

Less code is fewer bugs, fewer tokens and a smaller bundle. Before writing anything, check for a simpler way in this order, and stop at the first that fits:

1. **Don't build it.** Does the requirement need it? Is there an existing component, hook or helper in the codebase?
2. **The platform:** HTML and CSS before JavaScript, checked against Baseline for your browser targets.
3. **The installed library.**
4. **A vetted new library** (libraries.md).
5. **Your own code,** only for the product's core difference, or for something small with no edge cases. Write the reason in the pull request.

## Instead of this, try that

| Instead of | Try |
|---|---|
| JavaScript to show and hide a section | `<details>`/`<summary>`, or a CSS state (`:has()`, `:checked`) |
| A hand-built modal | `<dialog>` with `showModal()` (lock page scroll with `html:has(dialog:modal) { overflow: hidden }` and check on an iPhone), or the library's Dialog for sheets and stricter focus rules |
| JavaScript-positioned popovers and menus | The library's Popover or Menu (placement and menu keys handled); the bare `popover` attribute only for simple disclosures |
| Resize listeners to change a layout | CSS grid, flex wrap, `clamp()`, container queries |
| JavaScript sticky headers | `position: sticky` |
| A carousel library | CSS `scroll-snap`, with previous/next buttons calling `scrollBy()` and items reachable by Tab |
| JavaScript aspect-ratio boxes | `aspect-ratio` |
| JavaScript for smooth scrolling | `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`; in Next.js 16+ also add `data-scroll-behavior="smooth"` to `<html>` |
| A large animation library for fades and slides | CSS transitions on `transform` and `opacity`, with `@starting-style` for entry; View Transitions as an enhancement; Motion only for exit-on-unmount and gestures |
| `useEffect` plus `useState` to derive a value | Calculate it during render |
| A global store for server data | The query cache (TanStack Query) or server components |
| A global store for three flags | `useState` or `useReducer` where they're used, or context |
| Hand-written form validation for simple rules | Native `required`, `type` and `pattern` as the rules, with `noValidate` and your own inline errors (forms.md); a schema (Zod) for complex rules |
| Moment.js, or a full lodash | `Intl`, date-fns, and native `structuredClone`, `toSorted`, `at()`; `Object.groupBy` only if your targets start at Safari 17.4 |
| Hand-written plurals and number formats | `Intl.PluralRules`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` |
| A virtualization library for 200 rows | Paging, or `content-visibility: auto` |
| A WebSocket for updates every minute | Polling, or Server-Sent Events |
| A client fetch for a page's first data | Render it on the server |
| Micro-frontends for one team | A modular monolith (architecture.md) |
| A custom build or bundler config | The framework's defaults |
| A new abstraction after one or two uses | Duplicate it until the third use shows the real shape |

## Habits that keep code small

- **Delete code that isn't used.** Don't comment it out "for later": git remembers it.
- **No speculative props, options or layers** ("we might need it"). Add them when they're needed.
- **One way to do each thing.** When a better pattern arrives, migrate the old uses or record that it's planned.
- **Prefer boring, well-known solutions** over clever ones. The next reader, often another agent, should understand the code at once.

## Rules we deliberately don't adopt

These come up in reviews and sound rigorous, but make the code worse:

| Proposed rule | Why not | Instead |
|---|---|---|
| "No dependencies: build it ourselves" | Rebuilds solved, edge-case-heavy problems, badly and slowly | Platform, then library, then your own code (above) |
| "At most N `useState` per component" | React has no such guidance; forcing unrelated state together invites bugs | Judge state by its shape (react-patterns.md) |
| "Fewer `useEffect`s, for speed" | An Effect that subscribes costs almost nothing; Effects that set state are the real cost | No Effect where one isn't needed; one per independent sync |
| "`?.` and `Array.isArray` everywhere" | Hides real bugs as `undefined` and empty lists | Validate once at the boundary, then trust the types |
| "Every type in a central folder" | Separates props from their only user | Data types central; props beside their component |
| "Virtualize every list" | Adds weight when lists are paged anyway | Page first |
| "All UI state in the URL" | Back would step through open menus | The URL holds only what a shared link should restore |
| "Disable zoom to stop the iOS input zoom" | Blocks zoom for people who need it | 16px fields on touch screens |
| "`100vh` for full height" | Wrong on phones | `svh`/`dvh`, with a `vh` fallback |
| "Micro-frontends from day one" | Runtime failures and slower pages with no team problem to solve | A modular monolith |
| "Memoize everything" | Adds noise and memory for no measured gain | Memoize where profiling shows it pays, or use the React Compiler |
