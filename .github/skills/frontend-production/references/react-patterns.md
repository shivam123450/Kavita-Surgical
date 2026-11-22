# React patterns: rendering, data, types, state, Effects

## Contents
- Rendering and data loading
- Types and data at the boundary
- State
- Effects and refs

## Rendering and data loading

1. **Render on the server by default; use client code only for interaction.** Nothing that touches `window` or `localStorage` runs during a server render.
2. **No request waterfalls.** Independent reads run together (`Promise.all`). A screen that needs many resources gets one endpoint that gathers them.
3. **Send the client only the fields it renders.** Props passed from server to client are serialized into the page.
4. **Never put per-user data in a cache whose key doesn't include the user:** HTTP and CDN caches never hold personalised responses, server module state never holds user data, and `"use cache"` is only for answers that are the same for every user.
5. **Every write path checks permission.** A Server Action or API route is a public endpoint: authenticate and authorize inside each one.
6. **A fetch that follows typing** is debounced (150–300 ms), and the debounced value goes into the query key. TanStack Query then cancels the replaced request (pass its `signal` to `fetch`) and ignores late answers. `startTransition` keeps typing smooth but doesn't replace the debounce when filtering happens on the server.
7. **Every route has an error page and a not-found page, the app has a root error page** (`global-error.tsx` in Next.js, with its own `<html>` and `<body>`), and anything that reads the signed-in user sits under `<Suspense>`. An error page shows a reference and a Try again button, never the raw message.
8. **Nothing changes data during render or on a GET request.**

## Types and data at the boundary

1. **No `any`:** use `unknown` and narrow it. Keep `as` casts rare, with a comment on each. No `!` non-null assertions in app code.
2. **API types are generated from the contract:** `openapi-typescript`, tRPC, or GraphQL codegen. CI fails when they drift.
3. **Validate untrusted data once, where it enters:** URL parameters, `localStorage`, `postMessage`, third-party responses. Use Zod, then trust the types. Don't scatter `?.` and `Array.isArray` over values the types guarantee: that hides bad data as `undefined` and empty lists.
4. **Records saved before a field existed** are normalized once when they load, not guarded at every use.
5. **`??` for missing values.** Use `||` only when `""` and `0` should also fall back, and comment why.
6. **Import types with `import type`.** Use `interface` for object shapes and `type` for unions, as one convention.
7. **Prefer a type guard, `satisfies`, or a discriminated union over a cast.**

## State

There is no limit on the number of `useState` calls; judge state by its shape.

1. **Store only what can't be calculated.** Derive the rest during render, with `useMemo` if it's expensive.
2. **What always changes together is one piece of state:** one object, or `useReducer` when the changes follow rules.
3. **Make contradictions impossible:** `status: "idle" | "saving" | "saved" | "failed"`, not booleans that can both be true.
4. **Don't duplicate:** store `selectedId`, not a copy of the object.
5. **Keep state as low as possible,** lifted only as high as the components that share it.
6. **Put what a shared link should restore in the URL:** filters, search, sort, page, tab (nuqs helps). Open menus, dialogs and hover never go in the URL.
7. **Server data lives in the query cache, not a global store.** Use Zustand only for real client state that crosses screens.
8. **Initialise expensive state lazily** with `useState(() => build())`. Reset state with `key`, not an Effect.

## Effects and refs

An Effect keeps a component in step with something outside React: a timer, a subscription, a browser API, a connection.

| You want to… | Do this instead of an Effect |
|---|---|
| Calculate a value from props or state | Calculate it during render |
| React to a click, submit or key | Do it in the event handler |
| Focus or scroll to something a click just added | In the handler: `flushSync(() => set(…))`, then focus |
| Reset state when a prop changes | Give the component a `key` |
| Tell the parent something changed | Call its `onChange` in the same handler |
| Read a browser value that can change (online, media query) | `useSyncExternalStore` |
| Run once when the app loads | The client entry point (`main.tsx`, Next's `instrumentation-client.ts`); module code in a component file also runs on the server |

1. **An Effect that sets state costs an extra render,** and a chain of them costs one per link. That, not the number of Effects, is the cost.
2. **One Effect per independent thing being kept in step.**
3. **Every Effect that starts something stops it in its cleanup** (see memory.md).
4. **Dependencies are complete,** with `react-hooks/exhaustive-deps` as an error. To call the latest callback from an Effect without re-running it, wrap it in `useEffectEvent` (React 19.2+); call it only inside Effects, never to leave out a value that should re-run the Effect.
5. **Don't read or write `ref.current` during render,** except to initialise it.

Sources: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) · [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) · [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects) · [Next.js data security](https://nextjs.org/docs/app/guides/data-security)
