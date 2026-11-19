# Kavita Surgical

Kavita Surgical is a responsive, frontend-only surgical instrument catalogue for browsing instruments and contacting the business directly for product enquiries.

## Project overview

The website includes:

- A premium surgical instrument catalogue
- Product search and category filters
- INR sample or confirmed pricing presentation
- WhatsApp enquiry flows
- Quantity and quote-list inquiry support
- Product image preview
- Responsive desktop, tablet, and mobile layouts
- Business, GSTIN, phone, address, and Google Maps information
- SEO metadata and structured business information

## Technology stack

- React 18
- TypeScript
- Vite
- CSS
- Responsive WebP product images

No backend, database, authentication, checkout system, or payment gateway is included.

## Prerequisites

- Node.js 18 or newer
- npm

## Installation

```powershell
npm install
```

## Local development

```powershell
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Production build

```powershell
npm run build
```

The optimized static output is written to `dist/`.

To inspect the production build locally:

```powershell
npm run preview
```

## Product and business data

Product names, SKUs, categories, descriptions, images, and prices are maintained in `src/products.ts`.

Business contact details and social-link configuration are maintained in `src/business.ts`. Social profile URLs remain disabled until verified public URLs are provided.

## Deployment notes

Before public deployment:

1. Replace demonstration product prices with verified prices.
2. Configure the verified production domain.
3. Add the canonical, Open Graph, Twitter image, sitemap, and robots domain URLs.
4. Verify all product specifications and images.
5. Configure HTTPS and security headers at the hosting provider.

## Optional Supabase Admin Dashboard

The dashboard is available at `/#admin`.

1. Create a Supabase project in a development environment.
2. Apply `supabase/migrations/202611200001_initial_admin.sql`.
3. Copy `.env.example` to `.env.local` and add the Supabase project URL and anon key.
4. Create an email/password administrator in Supabase Authentication.
5. Insert that administrator's `auth.users.id` into `public.admin_users`.
6. Never expose a Supabase service-role key in frontend or Git files.

The public catalogue uses published Supabase products when configured and falls back to the static catalogue if Supabase is unavailable.
