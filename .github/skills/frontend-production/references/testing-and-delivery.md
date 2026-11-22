# Testing, checks, browser support and delivery

## Contents
- Tests
- Checks in CI (lint and others)
- Browser support
- Deployment and environments

## Tests

1. **Every pure helper has a unit test next to it** (Vitest). Cover the edge cases that matter: an empty list, a missing field, answers out of order, time-zone boundaries, rounding.
2. **Component behaviour that matters** is tested with Testing Library: interactions, accessible names, states.
3. **Critical paths have end-to-end tests** (Playwright):
   - against a production build;
   - in Chromium, Firefox and WebKit;
   - with an axe scan on each page;
   - with a touch-screen project, emulated (mobile-touch.md);
   - with resilience cases: offline, a slow network, an expired session, a server error.
4. **Tests never touch real data.** Mock the API with MSW, or run a throwaway backend with seeded data.
5. **A bug fix comes with the test that would have caught it.**
6. **Long-lived and real-time apps** also get a memory scenario (memory.md) and a replay of recorded live data at speed (app-types/trading-realtime.md).
7. **Design systems** get visual regression tests (Playwright screenshots or a service).
8. **No `eslint-disable`, `@ts-ignore` or `@ts-expect-error`.** Fix the code, or change the rule in the config, with the reason.

## Checks in CI (lint and others)

A rule a machine can check is checked by one, and fails CI:
- **TypeScript `strict`.**
- **Lint:**
  - `typescript-eslint` `strictTypeChecked` (or `recommendedTypeChecked` plus `no-non-null-assertion`), with `consistent-type-imports`; this adds `no-floating-promises` and `no-misused-promises`;
  - eslint-plugin-react-hooks' recommended preset (v7+ includes the React Compiler rules), with `rules-of-hooks` and `exhaustive-deps` as errors;
  - accessibility lint (`eslint-plugin-jsx-a11y`): check it supports your ESLint major version, and if it doesn't, vet a maintained fork or rely on the axe scan;
  - import boundaries (`no-restricted-imports` or `eslint-plugin-boundaries`);
  - `max-lines` as a warning at 300;
  - `no-restricted-syntax` for what the project bans: `dangerouslySetInnerHTML` outside one `SafeHtml` component that sanitizes, `autoFocus`, fixed inline styles.
- **Other checks:**
  - a formatter check;
  - unit tests, the build, and end-to-end tests with axe;
  - `npm audit --audit-level=high` and `npm audit signatures`;
  - bundle budgets and Lighthouse CI;
  - generated API types are up to date;
  - the audit script with `--strict`, if you adopt it.

What no linter catches goes on the review checklist (checklist.md).

## Browser support

1. **Supported browsers are written down** in `browserslist`, naming the oldest iOS.
2. **Frameworks compile new syntax down but don't polyfill new APIs.** Before using a newer API, check its Baseline status or MDN compatibility table against your targets, then detect it and fall back, or polyfill it. For example, an unguarded `AbortSignal.any` (Safari 17.4+) broke every search on iOS before 17.4, which Next.js's default targets (Safari 16.4+) include.
3. **CSS newer than your targets is an enhancement;** check what happens without it.
4. **Don't tell errors apart by names that browsers disagree on.** Older Chrome reports a timeout as `AbortError`, so check the signal instead.
5. **Test layout, input and navigation changes on real devices** (mobile-touch.md), and run the end-to-end tests in three engines.

## Deployment and environments

1. **Configuration is validated in one place** (architecture.md). Preview deployments are protected.
2. **A rollback takes minutes.** A frontend that needs a new API field ships after the API, and copes with the field being missing.
3. **Every change is reviewed:**
   - `CODEOWNERS` names the reviewers;
   - `main` is protected, so a merge needs that review and a green CI;
   - a dependency bot proposes updates.
4. **Self-hosted:**
   - a reverse proxy in front;
   - responses streamed, not buffered;
   - a graceful shutdown on `SIGTERM`;
   - the same build id on every instance; with several instances, a shared cache handler and the same Server Actions encryption key.
5. **A service worker caches nothing** unless there is an update plan (app-types/offline-pwa.md). Notification permission is asked only after the user turns notifications on.
6. **Feature flags** let a risky change ship dark and be switched off without a deploy.

Sources: [Playwright](https://playwright.dev/docs/intro) · [axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) · [MSW](https://mswjs.io/) · [Baseline](https://web.dev/baseline) · [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist) · [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
