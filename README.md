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
