# E-commerce, marketing, content and other public sites

Here, speed and search ranking directly move revenue. These pages are public, indexed and visited cold, often on a mid-range phone over mobile data.

## Rendering and speed
- **Static or incrementally regenerated pages** for content, listings and product pages. Cart, checkout and account pages are server-rendered with the data streamed in (architecture.md).
- **Core Web Vitals are a ranking and conversion factor:** treat the LCP image, fonts and third-party tags as the budget (performance.md).
- **Third-party tags** (analytics, ads, chat, A/B testing) load after the page is interactive or on consent. Each has an owner and a reason, and is reviewed every quarter.
- **A/B tests run on the server or the edge,** not by swapping content in the browser after load, which causes layout shift and flicker. Variant URLs carry `rel=canonical` to the original, redirects to them are 302, and finished tests are removed.
- **Prefetch likely next pages** (on hover, or with speculation rules), and keep pages eligible for the back/forward cache.

## Search engines and sharing
- **Each page has a unique `<title>`, meta description, canonical URL and Open Graph and Twitter tags.**
- **Structured data (JSON-LD)** for products, offers, reviews, breadcrumbs and articles.
- **An XML sitemap,** `robots.txt` for crawl rules, and `hreflang` for language and region versions.
- **Listings and pagination use real links** that crawlers can follow. Filter combinations that make no useful landing page are kept from being crawled (disallow their parameters in `robots.txt`, or keep them out of crawlable links).
- **Real 404 and 410 responses,** and 301 redirects when URLs change.

## Search, filters and listings
- **Filters, sort and page live in the URL.** Facets show counts, and the results update without a full reload.
- **Search tolerates typos, suggests as you type** (debounced and abortable), and its empty state helps.

## Cart and checkout
- **Guest checkout,** with the account offered after purchase.
- **EU:** the final button says "Order with obligation to pay" (or equally clear), and EU consumer law requires an easy online withdrawal function; check current rules for your market.
- **Autofill tokens on every field:** name, email, tel, shipping address and the card fields' tokens. Address lookup is optional, never mandatory.
- **Payments through the provider's hosted fields or redirect,** with Apple Pay and Google Pay through the provider's SDK (app-types/banking-payments.md, "Card data and PCI DSS").
- **The cart survives a reload and a sign-in.** Prices and stock are checked again on the server at checkout, and any change is shown clearly.
- **Errors keep everything that was entered,** and focus moves to the problem (forms.md). Show the total cost (tax, shipping) before the last step.

## Privacy, consent and law
- **Consent before non-essential cookies and trackers** where the law requires it (EU/UK GDPR and ePrivacy; India's DPDP Act once its consent rules apply; CCPA is opt-out, so honour Global Privacy Control). Rejecting is as easy as accepting. The banner doesn't shift the layout.
- **The European Accessibility Act applies to e-commerce in the EU** from June 2025 (accessibility.md).

## Content and marketing pages
- **Images in AVIF or WebP,** responsive, with `alt` text. Use video only with a poster, and never autoplay with sound.
- **Readable type:** body text 16px or larger, lines of 45–75 characters, and real headings in order.
- **Forms that capture leads** follow forms.md, with spam protection on the server (honeypot, rate limit) rather than a puzzle.
