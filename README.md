# Kavita Surgical

Responsive React and TypeScript catalogue for surgical instruments, with a Supabase-backed Admin Portal for products, categories, pricing, images, homepage content, and business contact settings.

## Technology and architecture

- React 18, TypeScript, and Vite build a static single-page application.
- Supabase Auth authenticates administrators; the browser uses only the Supabase project URL and publishable key.
- Supabase Postgres and Row Level Security are the authorization boundary for admin data. There is no custom server/API layer.
- Supabase Storage hosts managed images in the existing private `product-images` bucket. Public pages use short-lived signed URLs for published content.
- Existing HTTPS and same-origin legacy image URLs remain a validated fallback; recognized URLs from this project's `product-images` bucket are re-signed through Storage.
- Public products and categories are loaded from Supabase; the frontend has no static product catalogue fallback.

## Requirements and local setup

- Node.js 22 LTS and npm
- A Supabase project for catalogue and Admin Portal functionality

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set these variables in `.env.local` for local work, or in the deployment provider's environment settings:

| Variable | Purpose | Browser-visible |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (legacy anon key is accepted by the client) | Yes |

Vite embeds every `VITE_*` value into browser assets. **Never place a service-role key, database password, JWT secret, or other private credential in a `VITE_*` variable.** Do not commit `.env.local` or any other environment file.

```powershell
npm run dev
npm run lint
npm run typecheck
npm test --if-present
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Supabase setup

1. Apply every SQL migration in `supabase/migrations/` in filename order, including `202611200006_remove_legacy_category_read_policy.sql`. Do not skip migrations when upgrading an existing project.
2. Configure the `product-images` bucket and policies from the migrations. The bucket is private; only authorized admins can write, while signed reads are restricted to published content.
3. Configure Supabase Auth email/password sign-in, email verification, MFA and rate limits according to the deployment's risk profile.
4. Create an administrator account, then have a trusted project owner add its Auth UUID to `public.admin_users` using the Supabase SQL Editor:

   ```sql
   insert into public.admin_users (user_id)
   values ('<AUTH_USER_ID>')
   on conflict (user_id) do nothing;
   ```

5. Never add a service-role key to the browser or repository. Admin data access is enforced by Postgres RLS and Storage policies, not by hiding the `/admin` route.

Products, product galleries, featured status/order, optional GST rates, categories, filter categories, homepage content, section images, and business contact settings are managed in the Admin Portal. Existing published product/category policies and the admin allowlist must be verified in the target Supabase project after migrations are applied.

## Deployment

1. Configure the two public Supabase variables in the host's environment settings and build with `npm ci` followed by `npm run build`.
2. Deploy the contents of `dist/` to a static SPA host. Configure `/admin` to serve `index.html`; `public/_redirects` contains the Netlify-style rule.
3. Configure HTTPS and security headers at the host. A Content Security Policy must allow the configured Supabase project and the Google Fonts origins used by the site.
4. Replace domain-dependent metadata and `public/sitemap.xml` contents only after the verified production domain is known. The repository intentionally does not invent a canonical production URL.
5. Apply migrations and configure authentication, storage, and admin membership in the production Supabase project before opening the site to customers.

The CI workflow runs dependency installation, lint, type checking, any available tests, the production build, and `npm audit`; it requires no production secrets.
