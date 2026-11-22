# Security and privacy

## Contents
- Injection (XSS)
- Headers and CSP
- Sessions and authentication
- Secrets and storage
- Supply chain
- Personal data
- Verification standard

## Injection (XSS)

1. **No HTML from data in the DOM.** If user or model HTML must be shown:
   - sanitize it with DOMPurify, or show it in a sandboxed iframe;
   - never give the iframe `allow-scripts` and `allow-same-origin` together.
2. **No code built from data:** no `innerHTML`, `outerHTML`, `document.write`, `eval`, `new Function`, or a string passed to `setTimeout`. Where supported, enforce it with CSP `require-trusted-types-for 'script'` and one Trusted Types policy wrapping the sanitizer.
3. **A key that comes from data is checked against a known set** before `obj[key]`. This blocks prototype pollution. For data-keyed lookups use a `Map` or `Object.create(null)`, and never merge untrusted JSON without rejecting `__proto__`, `constructor` and `prototype` keys.
4. **Links built from data** get a fixed scheme in front (`tel:`, `mailto:`), or pass an allowlist of `https:` and `http:`, so a `javascript:` value can never run.
5. **A redirect target read from the URL** (`?next=`) is parsed with `new URL(next, location.origin)` and accepted only when its origin equals `location.origin`.
6. **External links that open in a new tab** get `rel="noopener noreferrer"`.
7. **Check where each message came from, and its shape,** before acting on `postMessage`, `BroadcastChannel` or a message from a service worker.
8. **Escape CSV and spreadsheet exports:** a text cell starting with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`, and every cell is quoted with embedded `"` doubled, so nothing runs as a formula.

## Headers and CSP

- **Content Security Policy:**
  - `default-src 'self'`, adding each extra host on purpose;
  - `object-src 'none'`, `base-uri 'none'` and `form-action 'self'` (they don't fall back to `default-src`), sent as an HTTP header, not a `<meta>`;
  - nonces or hashes for scripts where the rendering model allows them;
  - `frame-ancestors 'none'` (or a list) against clickjacking;
  - `upgrade-insecure-requests`;
  - violation reports sent to an endpoint.
- **Other headers:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains` (add `preload` only once every subdomain serves HTTPS);
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - `Permissions-Policy`, turning off the features you don't use;
  - `Cross-Origin-Opener-Policy: same-origin` (`same-origin-allow-popups` if sign-in or payment uses a popup) and `Cross-Origin-Resource-Policy: same-origin` or `same-site`.
- **A third-party script** needs a reason, its exact host in the CSP, and a pinned version with `integrity` and `crossorigin="anonymous"` (Subresource Integrity) if it comes from a CDN.

## Sessions and authentication

1. **Session cookies** are `HttpOnly`, `Secure` and `SameSite=Lax` or `Strict`, with the `__Host-` prefix (which requires `Secure`, `Path=/` and no `Domain`). Never put tokens in `localStorage` or `sessionStorage`.
2. **Writes are protected against cross-site requests:** the framework's CSRF protection or tokens, or an `Origin`/`Sec-Fetch-Site` check on every state-changing request. `SameSite` cookies help but aren't enough alone.
3. **A Server Action or API route is a public endpoint.** Authenticate and authorize inside each one. The UI hiding a button is not a permission check. The server checks that the signed-in user may access every record id it receives: insecure direct object references (IDOR) are the most common access-control flaw.
4. **Sessions have an idle and an absolute timeout, enforced on the server.** The UI warns before a timeout and lets the user extend (WCAG 2.2.1).
5. **Sign-out:**
   - the server ends the session;
   - the client deletes drafts and cached personal data;
   - `Clear-Site-Data: "cache", "storage"` is sent (`"storage"` also removes service workers; add `"cookies"` only if no other app on the domain needs them);
   - a page restored from the back/forward cache re-checks the session (`pageshow` with `persisted`).
6. **Prefer passkeys (WebAuthn)** for strong authentication. Ask for step-up authentication before sensitive actions.
7. **Sign-in errors don't reveal whether an account exists.**

## Secrets and storage

- **Secrets stay on the server.** A public environment variable is readable by anyone.
- **`localStorage` and IndexedDB never hold secrets, tokens or full card numbers.** Personal data kept there is minimal, expires, and is deleted at sign-out. Every access is wrapped in `try`/`catch`.
- **Source maps** go to the error tracker, never to the public.

## Supply chain

1. **CI fails on `npm audit --audit-level=high`.** A framework advisory is fixed the same day, by upgrading.
2. **Commit the lockfile and install with `npm ci`.** Set `ignore-scripts=true` in `.npmrc`, and run `npm audit signatures`. It also skips your own `pre`/`post` scripts; run packages that need install scripts explicitly (`npm rebuild <pkg>`).
3. **A dependency bot** (Dependabot or Renovate) proposes updates after a cooldown of a few days. Security fixes skip the cooldown.
4. **Every new package passes the vetting checklist** (libraries.md).
5. **Repository settings:** secret scanning with push protection, a protected `main`, and `CODEOWNERS`.

## Personal data

- **Personal data leaves the app only on purpose,** and each way out is minimal: exports, prints, logs, error reports, analytics, push-notification text (shown on lock screens).
- **No names, emails, phone numbers, card numbers or query strings** in logs or reports. Record ids are fine.
- **Opt-in consent before non-essential cookies and trackers** under EU GDPR and ePrivacy and India's DPDP Act (its duties phase in under the 2025 Rules); under CCPA/CPRA, offer a "Do Not Sell or Share" opt-out and honour Global Privacy Control. Know which law applies.
- **A private app stays out of search results:** `noindex` in the metadata and an `X-Robots-Tag` header. Don't block it in `robots.txt`: a crawler that can't fetch a page never sees its `noindex`.

## Verification standard

For banking, health, government or any high-risk app, verify against the **OWASP ASVS** (Level 2, or Level 3 for the highest risk), and check the client-side items in the OWASP cheat sheets.

Sources: [OWASP Top 10](https://owasp.org/Top10/) · [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) (XSS, DOM XSS, CSP, CSRF, HTTP headers, session management, third-party JavaScript, npm security) · [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [Next.js data security](https://nextjs.org/docs/app/guides/data-security) · [MDN Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
