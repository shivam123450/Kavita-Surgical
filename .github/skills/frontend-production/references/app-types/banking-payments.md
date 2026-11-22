# Banking, payments and other regulated apps (insurance, health, government)

Money and sensitive data raise the cost of every mistake. Everything in security.md applies at its strictest, plus the rules below.

## Contents
- Money and numbers
- Payments and transfers
- Card data and PCI DSS
- Authentication and sessions
- Showing sensitive data
- Third-party code and hardening
- Compliance and accessibility

## Money and numbers
- **Never use JavaScript floating point for money.** The API sends integer minor units (paise, cents) or decimal strings. Do any arithmetic with a decimal library (Dinero.js, big.js), and leave rounding rules to the server.
- **The server checks the user may see every account and transaction id requested** (IDOR).
- **Balances, fees, interest and limits are calculated by the server.** The client may show an estimate, labelled as one.
- **Format with `Intl.NumberFormat`,** using the currency code and the user's locale (`en-IN` gives ₹1,25,000.00). Use the currency's own number of decimal places.
- **Transaction lists:**
  - amounts right-aligned with tabular figures;
  - debit and credit shown by sign and label as well as colour;
  - dates in the bank's stated time zone;
  - the running balance taken from the server;
  - pending and posted transactions shown apart;
  - merchant and description text rendered as plain text.

## Payments and transfers
- **Every payment or transfer submit carries an idempotency key.** The button locks once the request starts. The result shows the server's status (pending, completed, failed), never an optimistic "Done".
- **Review before confirming:** a summary step shows amount, payee, account, fees and date. The confirm button names the action ("Pay ₹5,000 to Acme").
- **Step-up authentication** (a passkey or OTP) before adding a payee, a large transfer, or changing contact details. OTP fields use `autocomplete="one-time-code"` and accept paste.
- **A timeout or network failure on a payment** shows "We're checking whether this went through", then the confirmed status. Never invite a blind retry (resilience.md).

## Card data and PCI DSS
- **Card numbers never touch your code.** Use the payment provider's hosted fields or iframe, or a redirect, or Apple Pay and Google Pay through your payment provider (gateway tokenization). This keeps your pages out of most of the PCI scope.
- **On any page that hosts or embeds a payment form (PCI DSS v4.0.1, mandatory since 31 March 2025):**
  - **Requirement 6.4.3:** keep an inventory of every script on the page, with a written reason for each, and an integrity check (CSP plus Subresource Integrity).
  - **Requirement 11.6.1:** a mechanism that alerts on unauthorized changes to the page and its HTTP headers, as the browser receives them, at least weekly.
- **Keep payment pages lean.** Minimize third-party scripts on them: no analytics, chat widgets or tag managers unless they are inventoried and justified.

## Authentication and sessions
- **Prefer passkeys (WebAuthn).** Passwords work with password managers and paste. Sign-in errors never reveal whether an account exists.
- **Timeouts:** an idle timeout and an absolute session timeout, both enforced by the server. The UI warns before the idle timeout and gives at least 20 seconds to extend it with one action (WCAG 2.2.1), warns ahead of the absolute timeout, then signs out cleanly, keeping no sensitive data on screen.
- **Users can sign out everywhere,** and see their active sessions and devices.
- **Rate limits, bot defence and fraud scoring live on the server.** If a challenge is needed, it has an accessible alternative.

## Showing sensitive data
- **Mask account and card numbers** (show the last 4), with a "show" action that requires a fresh session and is recorded.
- **Never put account numbers, card numbers, balances or personal identity numbers in URLs, page titles, logs, analytics or error reports.**
- **Sensitive pages and API responses** are sent with `Cache-Control: no-store`, so no HTTP cache keeps them. That no longer guarantees they stay out of the back/forward cache, so on `pageshow` with `persisted`, re-check the session and refetch or clear sensitive data.
- **Notification text and email subjects** never include balances or full numbers (they appear on lock screens).
- **A web page can't stop screenshots or screen sharing.** Don't promise that it does; limit what is shown instead.

## Third-party code and hardening
- **A strict CSP** with nonces or hashes, `frame-ancestors 'none'` against clickjacking, and violation reporting.
- **Subresource Integrity** on every external script pinned to a fixed version. Payment-provider SDKs updated in place can't take SRI: allow their exact origin in the CSP and monitor them (11.6.1). Dependencies are reviewed before they're added, with a stricter bar than usual.
- **A kill switch** (feature flag) for risky features, and the ability to show a maintenance notice without a deploy.

## Compliance and accessibility
- **Verify against OWASP ASVS 5.0:** Level 3 for online banking and anything that moves money; at least Level 2 for other regulated apps.
- **The European Accessibility Act covers banking web and apps in the EU** from June 2025 (accessibility.md). Sign-in, step-up authentication, e-signing and payment confirmation must all be fully accessible. Statements and other documents must be accessible too, as tagged PDFs or HTML.
- **Consent records, audit trails and data-retention rules** come from the server. The UI shows and collects consent accurately, with no pre-ticked boxes or dark patterns.

Sources: [PCI DSS 4.0 requirements 6.4.3 and 11.6.1](https://blog.report-uri.com/pci-dss-4-0-1-and-requirements-6-4-3-and-11-6-1-what-changed-for-payment-page-scripts/) · [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) · [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) · [European Accessibility Act](https://www.accessibility-developer-guide.com/knowledge/legal/eaa/) · [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
