---
name: frontend-production
description: Production-grade engineering rules for any web frontend, whatever it is for: business apps and dashboards, banking and payments, trading and real-time data, video streaming, e-commerce and content sites, AI chat, offline apps. Points to focused references on architecture and folder structure, library choices (React Aria, Base UI, TanStack and others instead of hand-built widgets), components (tables, forms, dialogs), React patterns, performance and Core Web Vitals, memory leaks, mobile and touch, accessibility, security, resilience, testing and deployment, and the simplest solution that works. Includes a script that audits a codebase for common mistakes. Use when starting a frontend, building or reviewing a screen or component, choosing a library, fixing slowness, jank or growing memory, or getting a frontend ready for production. For visual design use ui-ux-impeccable.
---

# Frontend production

Rules for frontends that are fast, accessible, secure and free of leaks, whatever the product. They are written for React and TypeScript; for another framework, apply the same principle with its equivalent. Most reference files end with their sources.

## Work efficiently

1. **The project's own guide wins.** Follow applicable repository instructions. If the project has its own frontend guide, open this skill's references only for topics it lacks (usually libraries, mobile-touch and app-types).
2. **Read sections, not files.** List a reference's headings, then read only the section you need:
   `grep -n "^## " .github/skills/frontend-production/references/components.md`
   `sed -n '/^## Tables/,/^## Lists/p' .github/skills/frontend-production/references/components.md`
   For a one-line, copy or style change, the non-negotiables below are enough: open no reference.
3. **Search the codebase before writing.** Reuse an existing component, hook or helper that does the job.
4. **Take the simplest thing that works** ([references/simplicity.md](references/simplicity.md)), in this order: the platform, the installed library, a vetted library, your own code.
5. **Run the audit script** to find common mistakes instead of reading files to hunt for them (see "Audit script" below).
6. **Iterate on the narrowest check** (one test file, one browser), then run the full suite once at the end.
7. **Read the installed version's docs** for an API newer than you know, or one the type check or build rejects; only that API's page.
8. **Ask the user only about real product decisions.** Don't ask what this skill already decides.
9. **Report what you did not verify.** Never claim a check passed without running it. In the answer, give the result, not which files you read.

## Non-negotiables for every frontend

- **Library first.** Never hand-build a combobox, dialog, date picker, data grid, toast, drag and drop, rich text, form state, date arithmetic or sanitizer. Defaults: shadcn/ui on React Aria or Base UI; TanStack Query, Table and Virtual; React Hook Form + Zod; Sonner; cmdk; date-fns + @date-fns/tz; DOMPurify; dnd-kit; Playwright + axe. Open [libraries](references/libraries.md) only for another job or to vet a new package.
- **Every data view has loading, empty, error and no-access states,** and every control has its full set of states. See [components](references/components.md).
- **Requests have a timeout and can be aborted, and an out-of-order answer is ignored.** A write is retried only with an idempotency key the server honours. Real-time connections back off with jitter and resync after reconnecting. See [resilience](references/resilience.md).
- **What a component starts, it stops:** listeners, timers, observers, sockets, workers, object URLs, chart and player instances. Caches and buffers have a cap. See [memory](references/memory.md).
- **Core Web Vitals at the 75th percentile:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, with budgets in CI. See [performance](references/performance.md).
- **WCAG 2.2 AA:** works by keyboard, every control named, visible focus, AA contrast, targets of 24px or more. See [accessibility](references/accessibility.md).
- **On touch screens:** fields at least 16px, zoom never disabled, `svh`/`dvh` with a `vh` fallback, and the keyboard opens only when the user taps a field or a control meant for typing. See [mobile-touch](references/mobile-touch.md).
- **Security:** the server authorizes every record id it receives (never trust an id from the client); no HTML or code built from data, secrets only on the server, a CSP, and sessions in `HttpOnly` cookies. See [security](references/security.md).
- **Strict TypeScript, no `any`;** untrusted data is validated once, where it enters. See [react-patterns](references/react-patterns.md).
- **Money, prices and traded quantities are never floating point** (integer minor units or a decimal library). Dates and numbers are formatted through `Intl` with an explicit locale and time zone.
- **Tests:** unit tests for helpers, and end-to-end tests of critical paths in three browser engines with an axe scan. See [testing-and-delivery](references/testing-and-delivery.md).

## Workflows

Follow the checklist that fits; don't copy it into your answer.

**Start a new frontend**
```
- [ ] Read architecture.md; record the stack decisions (defaults are there)
- [ ] Read the app-type file(s) below that match the product
- [ ] Set up the checks in testing-and-delivery.md
- [ ] Run checklist.md, part A
```

**Build a screen or component**
```
- [ ] Search the codebase for existing pieces to reuse
- [ ] components.md (+ forms.md for a form); libraries.md for any widget
- [ ] The app-type file for domain rules
- [ ] Run the audit script and the tests; then checklist.md, part B
```

**Review frontend code:** run the audit script, read the references for the areas it flags, then work through checklist.md part B.

**Slow, janky, or memory keeps growing:** measure first (performance.md, "Measure first"; memory.md, "Find a leak"), fix the biggest cause, and measure again. Never optimise without a measurement.

**Before a release:** checklist.md, part C.

## Routing: by topic

| Need | Read |
|---|---|
| Stack, folder structure, monorepo or micro-frontends, rendering strategy, design system, config | [architecture.md](references/architecture.md) |
| Which library to use, and how to vet one | [libraries.md](references/libraries.md) |
| Loading, empty and error states; tables, dialogs, selects, navigation, toasts, uploads, search, charts | [components.md](references/components.md) |
| Forms, validation, which keyboard a field opens (inputMode, enterKeyHint), autofill, drafts | [forms.md](references/forms.md) |
| Server and client rendering, data loading, types, state, Effects | [react-patterns.md](references/react-patterns.md) |
| Core Web Vitals, bundles, long tasks, workers, images, fonts, measuring | [performance.md](references/performance.md) |
| Memory leaks: causes, cleanup, how to find one | [memory.md](references/memory.md) |
| Phones and tablets: when the keyboard opens, zoom, viewport units, hit areas, safe areas | [mobile-touch.md](references/mobile-touch.md) |
| WCAG 2.2 AA, legal requirements, checking by hand | [accessibility.md](references/accessibility.md) |
| XSS, CSP, sessions, supply chain, personal data | [security.md](references/security.md) |
| Error boundaries, offline, timeouts, retries, WebSocket/SSE reconnection, monitoring | [resilience.md](references/resilience.md) |
| Tests, lint checks, CI, browser support, deployment | [testing-and-delivery.md](references/testing-and-delivery.md) |
| A simpler way to do it; rules not to adopt | [simplicity.md](references/simplicity.md) |
| Done checklists: new project, each change, release | [checklist.md](references/checklist.md) |

## Routing: by app type

Read every file that matches. A banking dashboard with live prices reads both the banking and the trading file.

| Building | Read |
|---|---|
| CRM, admin panel, internal tool, B2B SaaS, dashboard | [app-types/business-apps.md](references/app-types/business-apps.md) |
| Banking, payments, insurance, health, government (regulated, money or sensitive data) | [app-types/banking-payments.md](references/app-types/banking-payments.md) |
| Trading, live prices, monitoring, IoT, sports scores (high-frequency real-time data) | [app-types/trading-realtime.md](references/app-types/trading-realtime.md) |
| Video or audio streaming, live video, TV apps | [app-types/media-streaming.md](references/app-types/media-streaming.md) |
| E-commerce, marketing site, blog, documentation, any public page that needs SEO | [app-types/commerce-content.md](references/app-types/commerce-content.md) |
| AI chat, copilot, streamed generation | [app-types/ai-chat.md](references/app-types/ai-chat.md) |
| Offline-first app, PWA, field app on poor connections | [app-types/offline-pwa.md](references/app-types/offline-pwa.md) |

## Audit script

Run it from the project root (Node 18+, no install), passing the folders that hold the UI code (default `src`; e.g. `app components lib` when there is no `src`). It exits with status 2 if it scanned no files:

```bash
node .github/skills/frontend-production/scripts/audit.mjs src
```

- **What it reports:** for each rule, how many places break it, a few `file:line` locations, and the reference file that explains the fix. Examples: zoom disabled, `100vh` with no `svh` fallback, `autoFocus`, HTML built from data, `target="_blank"` without `rel`, listeners, timers, observers or sockets with no cleanup, object URLs never revoked, index keys, `any`, lint suppressions, `console.log`, `transition: all`, outlines removed, clickable `div`s, images without `alt`.
- **Use it cheaply:** each hit's message is the fix; open a reference only when the message isn't enough, and then only its section. Mark a reviewed false positive with `// audit-ok` on the line or the line above.
- **Options:** `--all` lists every location, `--json` is for CI (agents use the text output), `--include-tests` scans test files too, and `--strict` exits with status 1 when any must-fix rule is broken (for CI).
- **Limits:** it matches patterns in the text, so a hit is a place to look, not proof of a bug. A clean run doesn't prove the code is correct.
