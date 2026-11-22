# Checklists

Work through the part that fits. Report only items that failed or were skipped, with the reason; a box ticked without running the check is worse than an honest "not checked". The file that explains each area is named in brackets.

## Contents
- A. New project, before the first screen
- B. Every new component, screen or review
- C. Before a release

## A. New project, before the first screen

```
- [ ] Stack decisions recorded in AGENTS.md or docs/decisions.md (architecture)
- [ ] App-type file(s) read; their rules added to the project's guide (app-types/*)
- [ ] Folder structure and import boundaries set up and linted (architecture)
- [ ] TypeScript strict; ESLint with typescript-eslint, React Hooks, a11y, boundaries; formatter (testing-and-delivery)
- [ ] browserslist names the oldest iOS (testing-and-delivery)
- [ ] `<html lang>` set, and updated per locale (accessibility)
- [ ] Component library installed (shadcn on React Aria or Base UI); tokens set with ui-ux-impeccable (libraries)
- [ ] Viewport meta: device-width, initial-scale=1, interactive-widget=resizes-content, no zoom limits; iOS format detection off (mobile-touch)
- [ ] 16px fields under (pointer: coarse); svh full-height layout with a vh fallback (mobile-touch)
- [ ] Error, not-found and loading pages for every route (react-patterns)
- [ ] One API client: timeouts, abort, offline messages, no write retried without an idempotency key (resilience)
- [ ] Env vars in .env.example, validated in one module; no secrets in public vars (architecture)
- [ ] Security headers and a CSP with reporting; HttpOnly, Secure, SameSite cookies (security)
- [ ] Error tracking and Core Web Vitals reporting, with the release id (resilience)
- [ ] .npmrc with ignore-scripts; lockfile committed; npm ci in CI (security)
- [ ] CI runs typecheck, lint, unit, build, audit, e2e with axe in three engines plus a touch project, and budgets (testing-and-delivery)
- [ ] Dependency bot with a cooldown, CODEOWNERS, protected main, secret scanning (security)
- [ ] Preview deploys protected; noindex if the app is private (security)
```

## B. Every new component, screen or review

```
- [ ] Ran the audit script; each must-fix hit fixed or explained
- [ ] Reused existing pieces; widgets come from the platform or a vetted library (simplicity, libraries)
- [ ] Component has its full state matrix; data views have loading, empty, error and no-access states (components)
- [ ] Tables: numbers right-aligned with tabular figures, sticky header, server-side sort and filter when large, state in URL (components)
- [ ] Forms: labels, right keyboard and autofill, errors on blur, focus on the first error, busy submit, typed work kept (forms)
- [ ] No component defined inside another; files under about 300 lines; logic in tested helpers (architecture)
- [ ] No any, unexplained as, !, or lint suppressions; untrusted data validated at the boundary (react-patterns)
- [ ] State derived where possible; no needless Effects; every Effect cleans up (react-patterns, memory)
- [ ] Listeners, timers, observers, sockets, workers, object URLs and third-party instances released; buffers capped (memory)
- [ ] No waterfalls; heavy parts loaded on demand; lists capped or paged; images sized; nothing shifts (performance)
- [ ] Touch: works at 320px, no keyboard until a field is tapped, targets 24px or more, nothing hover-only, fits a phone on its side (mobile-touch)
- [ ] Accessibility: names, headings, title, contrast, visible focus, focus managed in dialogs, announcements, reduced motion (accessibility)
- [ ] Security: server authorizes every record id; no HTML or code from data, safe links, no secrets client-side, no personal data in logs (security)
- [ ] Money in minor units or a decimal library; dates and numbers through one Intl module with explicit locale and time zone (components, app-types/banking-payments)
- [ ] App-type rules for this product followed (app-types/*)
- [ ] Unit tests for helpers; an e2e spec if the path must never break; a regression test for any bug fixed (testing-and-delivery)
- [ ] Checked by hand: keyboard only, a screen reader, 200% zoom, desktop and phone width
```

## C. Before a release

```
- [ ] Typecheck, lint, unit, build, audit and e2e pass in three engines; budgets hold
- [ ] Real iPhone (Safari, and the home-screen app if supported) and real Android (Chrome): keyboard with fixed bars and dialogs, no zoom on focus, phone on its side, safe areas
- [ ] No open high-severity advisory in the framework or dependencies
- [ ] API changes additive; old tabs and a rollback still work; version-skew handling on
- [ ] Error tracking receives a test error carrying the release id; source maps private
- [ ] Long-lived or real-time screens: memory steady over a long session (memory)
- [ ] Rollback path known and tried; risky features behind a flag
- [ ] After release: real-user LCP, INP and CLS at p75 and the error rate compared with the previous release (performance, resilience)
```
