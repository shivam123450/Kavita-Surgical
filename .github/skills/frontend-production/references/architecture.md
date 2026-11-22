# Architecture: stack, structure and scale

## Contents
- Decisions to record before the first screen
- Rendering strategy by app type
- Folder structure
- Imports and boundaries
- Components and their APIs
- Scaling: monolith, monorepo, micro-frontends
- Design system
- Configuration and environments

## Decisions to record before the first screen

Write these in `AGENTS.md` or `docs/decisions.md`, each with a date and a reason. Later sessions follow what is written down; they can't follow what isn't.

| Decision | Default unless there's a reason |
|---|---|
| Framework | **Next.js (App Router)** for server rendering, public pages, SEO or server-side data. **Vite + React** with TanStack Router or React Router for an app entirely behind sign-in that talks to a separate API. |
| Language | TypeScript with `strict: true`. |
| Supported browsers | `browserslist` in `package.json`, starting from the framework's list and naming the oldest iOS. In Vite, set `build.target` to match. |
| Components | **shadcn/ui** (copied into the repo, so you own the styling): the React Aria base for apps heavy on forms, touch, dates and accessibility; the Base UI base otherwise; Radix for an existing Radix codebase. See libraries.md. |
| Styling | Tailwind CSS or CSS Modules, with design tokens as CSS variables. |
| Server data | Server components in Next.js; TanStack Query in the browser; types generated from the API (`openapi-typescript`). |
| Forms | React Hook Form with Zod. |
| Sign-in | Better Auth, or the identity provider's SDK (Clerk, Auth0, Microsoft Entra ID). Never hand-rolled. Auth.js is in maintenance; keep it only in existing code. |
| Monitoring | Error tracking (Sentry or similar) and Core Web Vitals reporting from the first deploy. |
| Hosting | Preview deploys that are protected, a rollback path, and version-skew handling. |
| Visual design | Tokens, type scale and palette set with ui-ux-impeccable before screens are built. |

## Rendering strategy by app type

| App | Strategy | Why |
|---|---|---|
| Marketing, blog, documentation | Static generation, revalidated on change | Fastest LCP, cheapest, best for SEO |
| E-commerce | Static or incremental pages for listings and products; server-rendered and streamed pages for cart, checkout and anything personal | SEO and LCP for the catalogue, freshness where it matters |
| Business app behind sign-in | A server-rendered shell with the data streamed in, or a client app (SPA) talking to an API | No SEO need; the cost is in interaction (INP) |
| Real-time (trading, monitoring) | A server-rendered shell, with the client subscribing to live data | The data changes faster than any page render |
| Streaming media | A server-rendered catalogue; the player loads in the browser on demand | Catalogue SEO and LCP, with player JavaScript kept off the first load |

Never cache per-user responses in a shared cache, whatever the strategy.

## Folder structure

Organise by feature, with shared code below it:

```
src/
  app/                 routes only: layout, page, loading, error (thin)
  components/
    ui/                design-system primitives, wrapping the component library
    <area>/            components shared inside one area (e.g. billing/)
  features/<feature>/  hooks, pure helpers, types and tests for one feature
  lib/                 framework-free utilities: API client, dates, formatting
  types/               data types per domain, generated from the API where possible
  styles/              tokens and global CSS
```

- **Tests sit next to their code** (`format.ts` and `format.test.ts`); end-to-end tests go in `e2e/`.
- **Route files stay thin:** title, metadata, permission gate, then one component.
- **One exported component per file, named after the file.** Small private helpers are fine: no state, no Effects, under about 40 lines.
- **Files stay under about 300 lines.** Past that, split out sub-components, hooks or pure helpers.
- **Logic that isn't UI is a pure, tested function** outside the component.
- **No barrel files** (`index.ts` re-exports): they pull whole folders into bundles and slow builds and tests.
- **No empty folders** made for symmetry.
- **For large, multi-team apps,** Feature-Sliced Design gives stricter layers: `app → pages → widgets → features → entities → shared`, where each layer imports only from layers below it. It takes time to learn, so adopt it only when the simpler structure starts to tangle. With Next.js, name its `app` and `pages` layers `_app` and `_pages` so they don't clash with Next's folders.

## Imports and boundaries

1. **Imports point one way:** `lib/` ← `components/ui/` ← `features/` and `components/<area>/` ← views and pages ← routes. Shared code never imports a feature.
2. **Features don't import each other.** What two features need moves down into shared code.
3. **Enforce it with lint:** `no-restricted-imports` blocks, or `eslint-plugin-boundaries`. A rule nobody checks drifts.
4. **Server-only modules say so** with `import "server-only"`. That makes importing a module that reads secrets into client code a build error.

## Components and their APIs

1. **Never define a component inside another.** It becomes a new type on every render, so state and focus are lost.
2. **A variant is a union prop** (`variant: "primary" | "danger"`), not boolean modes. Booleans for state and permissions (`open`, `busy`, `canEdit`) are fine.
3. **Use `children` for structure.** Use a render function only to hand data back, as in `columns[].render(row)`.
4. **A group of parts shares state through a provider** (compound components). A part never reaches into its parent through refs or syncs state up with an Effect.
5. **Pick the building block by its job:** a button for an action, a link for navigation, an option in a select or combobox for picking a value, a menu for actions, a dialog or popover for a floating panel. Reuse the shared one; never build a second.
6. **Wrap library components in your own `ui/` components,** so the library's API appears in one place and can be swapped.
7. **Use the current APIs.** In React 19: `ref` is a plain prop (no `forwardRef`), and context is read with `use(Context)` and provided with `<Context value>`.

## Scaling: monolith, monorepo, micro-frontends

| Situation | Choose |
|---|---|
| One team, one app | A modular monolith with the structure above |
| Several apps sharing code (web, admin, design system) | A monorepo (Turborepo or Nx) with shared packages |
| Three or more teams that need independent release cycles on one product | Micro-frontends (Module Federation, or route-level splits), only if a shared release train is costing more than the added complexity |

Micro-frontends add runtime failures, duplicated dependencies, slower LCP and harder shared state. Avoid them for a single team, when performance is what sets the product apart, or when state is heavily shared. A modular monolith can split later along its feature boundaries.

## Design system

- **Tokens first:** colour, type, spacing, radius, shadows, z-index layers and breakpoints, as CSS variables. Never hard-code a colour or z-index number in a component.
- **Primitives wrap the component library;** product components are built from primitives. Use the atoms → molecules → organisms → templates inventory in ui-ux-impeccable to see what's missing.
- **Once more than one team or app uses it,** document it (Storybook or similar), version it as a package, and give it visual regression tests.
- **One family per kind:** one icon set, one spacing scale, one radius scale, one elevation scale.

## Configuration and environments

1. **Configuration comes from environment variables.** Each is listed in `.env.example` with a comment, and is read and validated in one module at startup (with Zod), so a missing value fails loudly. `.env*` files are git-ignored, except `.env.example`. In Next.js, keep two modules: a server one (`import "server-only"`) for secrets, and a client one that reads each `NEXT_PUBLIC_` variable by its literal name (dynamic access isn't inlined).
2. **Public variables** (`NEXT_PUBLIC_`, `VITE_`) are compiled into the JavaScript and readable by anyone. Never put a secret in one.
3. **A feature flag comes from a service or the API,** never a hard-coded constant. Remove it once the feature is fully launched.

Sources: [Bulletproof React](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md) · [Feature-Sliced Design](https://feature-sliced.design/blog/frontend-scalability-tips) · [Micro-frontends: when they work](https://feature-sliced.design/blog/micro-frontend-architecture) · [Nx: micro-frontend architecture](https://nx.dev/docs/kb/micro-frontend-architecture) · [Vercel composition patterns](https://github.com/vercel-labs/agent-skills)
