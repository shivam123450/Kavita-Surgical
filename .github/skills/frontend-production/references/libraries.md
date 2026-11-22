# Library picks: what to use instead of building it

Read this before building any component or piece of infrastructure. The picks were checked in November 2026. Libraries change, so **run the vetting checklist before installing any of them**, and prefer what the project already has. Give one default per job, as the tables do; use an alternative only for the reason its row gives.

## Contents
- Vetting checklist for any new package
- Picks by job: UI components and behaviour; data, state and forms; text, dates, uploads and security; sign-in, monitoring and flags; testing and tooling
- Picks for specific kinds of app: real-time and trading, media, money, offline, collaboration, AI chat
- Signs you are hand-building something you shouldn't

## Vetting checklist for any new package

Check each item and put one line about the outcome in the pull request.

1. **Maintained:** a release in roughly the last 6 months, issues getting answers, and more than one maintainer for anything critical. The last-publish date is on npm; issue and commit activity is on GitHub.
2. **Fits the stack:** its `peerDependencies` (`npm view <pkg> peerDependencies`) cover your React, framework and ESLint majors. It works with server rendering, and with React Server Components if you use them.
3. **Accessible:** the docs cover keyboard use, screen readers and touch. For UI, try it with the keyboard and VoiceOver before adopting it.
4. **Browser support** matches your `browserslist`, iOS Safari included.
5. **Size:** what it adds to the bundle (check with a bundle analyzer or pkg-size.dev), and whether it tree-shakes.
6. **Safe:**
   - `npm audit` is clean;
   - no install script, or one you have read;
   - published with provenance where possible;
   - a common licence (MIT, Apache-2.0, ISC).
7. **Typed:** it ships its own TypeScript types.
8. **Escapable:** you can wrap it in your own component and swap it later.
9. **One per job:** it doesn't duplicate a library already installed.

## Picks by job

**Platform first** means the browser does it natively. Check the feature's Baseline status against your targets.

### UI components and behaviour

| Job | Use | Alternatives and when | Platform first |
|---|---|---|---|
| Accessible primitives (dialog, popover, menu, select, combobox, tabs, tooltip) | **React Aria Components** (Adobe) | **Base UI** (by the authors of MUI and Radix; v1 since Dec 2025); **Radix** for existing Radix code; **Ariakit** | `<dialog>`, `popover`, `<details>`, `<select>` for short lists |
| Styled component kit you own | **shadcn/ui**, on its React Aria base for apps heavy on forms, touch and dates, or its Base UI base (the default since July 2026) | Mantine or MUI when you want a complete styled library and accept its look | |
| Date and time pickers, calendars | **React Aria** `DatePicker`, `DateRangePicker` and `Calendar` (time zones through `@internationalized/date`) | shadcn's date picker | `<input type="date">` for simple cases, which uses the phone's native picker |
| Command palette | **cmdk** (shadcn's Command) | React Aria `Autocomplete` | |
| Toasts | **Sonner** (shadcn's toast) | React Aria Toast | |
| Bottom sheet or drawer on phones | shadcn's Drawer, which is built on Vaul | A React Aria Modal styled as a sheet | `<dialog>` with CSS |
| Positioning a custom popover | **Floating UI** | | CSS anchor positioning, once it's Baseline for your targets |
| Icons | **lucide-react** | Heroicons, Phosphor | Inline SVG for one or two icons |
| Animation | CSS transitions first, then **Motion** (formerly Framer Motion) | | View Transitions API, as an enhancement |
| Drag and drop | **dnd-kit**, with its keyboard sensor turned on | **Pragmatic drag and drop** (Atlassian) for large boards or code that isn't React | |
| Rich-text editing | **Tiptap** | **Lexical** (Meta) | `contenteditable` is never enough by itself |
| Charts | **Recharts** (shadcn charts) | **ECharts** for heavy or large data; **visx** for custom charts. Give the same numbers as a table or text for screen readers | |

Vaul's maintenance has been uncertain; check its latest release before relying on it.

### Data, state and forms

| Job | Use | Alternatives and when | Platform first |
|---|---|---|---|
| Form state | **React Hook Form** | TanStack Form; **Conform** with Next.js Server Actions | Uncontrolled inputs with `FormData` for tiny forms |
| Schema validation (forms, URL parameters, storage, third-party data) | **Zod** | Valibot when bundle size matters most | `required`, `type` and `pattern` for simple checks |
| Server data in the browser | **TanStack Query** | SWR | Server components for reads in Next.js |
| API types | **openapi-typescript**, with `openapi-fetch` | tRPC or oRPC when the same team owns the API; GraphQL Codegen | |
| State in the URL | **nuqs** | The router's own search-parameter API | `URLSearchParams` |
| Global client state | Plain React state and context first, then **Zustand** | Jotai | |
| Tables | **TanStack Table**, headless | AG Grid when you need a spreadsheet-grade grid | `<table>` for plain data |
| Long lists | Paging first, then **TanStack Virtual** | | CSS `content-visibility: auto` |

### Text, dates, uploads and security

| Job | Use | Alternatives and when | Platform first |
|---|---|---|---|
| Date arithmetic and time zones | **date-fns** with **@date-fns/tz** | **Temporal**, with its polyfill until Safari ships it | `Intl.DateTimeFormat` for display |
| Number and currency formatting | | | `Intl.NumberFormat` (`en-IN` gives lakh grouping) |
| Phone number checks | **libphonenumber-js** | | |
| Translations | **next-intl** in Next.js | react-i18next, Lingui, FormatJS | `Intl.PluralRules`, `Intl.RelativeTimeFormat` |
| Sanitizing HTML | **DOMPurify** | A sandboxed iframe | Never `innerHTML` with raw data |
| File uploads | **react-dropzone**, then a signed upload URL straight to storage | **Uppy** for resumable and large uploads | `<input type="file">` with `accept` |

### Sign-in, monitoring and flags

| Job | Use | Alternatives and when |
|---|---|---|
| Sign-in and sessions | **Better Auth** | Your identity provider's SDK (Clerk, Auth0, Microsoft Entra ID, Firebase Auth); Auth.js only in existing code (maintenance mode) |
| Error tracking | **Sentry** | OpenTelemetry with a backend you choose |
| Core Web Vitals | **web-vitals**, or Next's `useReportWebVitals` | Vercel Speed Insights |
| Feature flags | The provider's SDK, through **OpenFeature** | GrowthBook, LaunchDarkly, PostHog |
| Product analytics | **PostHog** | Plausible for privacy-first page counts |

### Testing and tooling

| Job | Use | Alternatives and when |
|---|---|---|
| Unit tests | **Vitest** | |
| Component tests | **Testing Library** | Vitest browser mode |
| End-to-end tests | **Playwright**, in three engines | |
| Accessibility checks | **@axe-core/playwright** | |
| Mocking APIs | **MSW** | |
| Linting | **ESLint** with typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y (check it supports your ESLint major), and eslint-plugin-boundaries | **Biome** for linting and formatting in one fast tool |
| Formatting | **Prettier** | Biome |
| Performance budgets | **Lighthouse CI**, plus a bundle-size check | size-limit |
| Dependency updates | **Dependabot** or **Renovate**, with a cooldown | |

## Picks for specific kinds of app

| Job | Use | Alternatives and when |
|---|---|---|
| Financial and price charts | **TradingView Lightweight Charts** (canvas, small) | **uPlot** for very large, fast time series; ECharts for many chart types |
| Order books and dense live tables | Canvas, or a virtualized table with each cell subscribed to its own data | |
| Moving work off the main thread | **Comlink**, wrapping Web Workers | |
| Money and exact decimals | Integer minor units (paise, cents) from the API; **Dinero.js** or **big.js**/**decimal.js** for arithmetic | Never JavaScript floating point for money |
| Video playback | **Shaka Player** (DASH and HLS, DRM through EME, many platforms) | **hls.js** for HLS only (smaller); **Video.js** (v10, successor to Vidstack) for player UI |
| TV and remote-control navigation | **Norigin Spatial Navigation** | |
| Service worker and caching | **Workbox** | |
| Offline data in the browser | **Dexie** (IndexedDB) | TanStack Query's persisters for cached reads |
| Real-time collaboration | **Yjs** (CRDT), self-hosted or through a provider | Liveblocks or PartyKit as hosted services |
| Streaming markdown from an LLM | A streaming-aware renderer (e.g. **Streamdown**), with output sanitized | react-markdown buffered to paragraph boundaries |
| Finding memory leaks | **memlab** | Chrome DevTools heap snapshots |

## Signs you are hand-building something you shouldn't

Stop and look for a library if you find yourself writing any of these:

- **Dialogs:** a `keydown` handler for Tab inside a dialog (a focus trap), or code that turns body scrolling off and on.
- **Lists:** `aria-activedescendant`, or arrow-key handling over a list of options.
- **Positioning:** maths on `getBoundingClientRect` to keep a popup on screen.
- **Dates:** days-of-month grids or time-zone offsets.
- **Forms:** a validation state machine, or "touched" and "dirty" tracking across many fields.
- **Lists of data:** sorting, selection and paging state for a table.
- **Timing:** debounce, retry or cache logic around `fetch`.
