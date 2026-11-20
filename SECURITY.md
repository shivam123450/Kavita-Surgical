# Security policy

## Supported deployment model

This project is a browser-based React/Vite SPA with direct Supabase access and no custom server/API. All authorization for products, categories, filter categories, homepage settings, business settings, site images, product images, and Storage objects must therefore be enforced by Supabase Row Level Security and Storage policies.

The browser may contain only `VITE_SUPABASE_URL` and a Supabase publishable/anon key. Vite embeds `VITE_*` values in public assets. Never add service-role keys, database passwords, signing secrets, or private credentials to frontend code, `.env.example`, CI variables used by the build, or any `VITE_*` variable.

Admin access is an authenticated Supabase user whose UUID is present in `public.admin_users`. The Admin Portal's route and UI are not security boundaries. Keep the Supabase `is_admin()` function, RLS policies, and private Storage bucket enabled; test authorization in the target project after each migration.

The Supabase browser client manages its auth session in browser storage by default; the SPA does not issue HttpOnly session cookies. RLS limits what a stolen browser token can do, but an XSS issue could still act as the current user. An HttpOnly-cookie session requires a server-side/SSR authentication layer, which this static application does not currently have.

## Reporting a vulnerability

Please report security issues through a private GitHub Security Advisory for this repository. Do not include credentials, customer information, or other sensitive data in a public issue.

## Credential response

If a private credential is committed or exposed:

1. Revoke or rotate it immediately in the issuing service; removing it from the latest commit is not sufficient.
2. Replace it with a secret-manager/deployment setting and verify that it is not exposed as a `VITE_*` variable.
3. Coordinate a history rewrite with repository collaborators. A maintainer can use `git filter-repo` to remove affected blobs, then force-push only with explicit repository-owner approval. Rewriting history does not replace credential rotation.

## Production controls to configure

- Enable Supabase Auth email verification, MFA for administrators, CAPTCHA/rate limits as appropriate, and a least-privilege administrator allowlist.
- Keep `product-images` private and apply the checked-in Storage policies.
- Configure HTTPS, security headers, and a Content Security Policy at the static hosting provider.
- Store deployment credentials only in the provider's protected environment settings; CI should not need production secrets.
