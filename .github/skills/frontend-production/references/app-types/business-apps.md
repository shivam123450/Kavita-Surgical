# Business apps: CRM, admin, internal tools, B2B SaaS, dashboards

People keep these open all day, work fast with the keyboard, and handle other people's data. The cost is in interaction speed, data integrity and permissions, not first load.

## Structure and workflow
- **Lists, then detail, then edit is the core loop.** A list's filters, sort, page and search live in the URL, so a link or Back restores the view exactly. Offer saved views for heavy users.
- **Dense tables done well** (components.md, "Tables and data grids"): server-side sort, filter and paging; bulk actions that report partial failure; a density setting.
- **Keyboard first:** a command palette (Ctrl/⌘+K) and shortcuts for frequent actions, each listed in the UI. Never take over reserved browser keys (Ctrl/⌘+T, W, N, L) or screen-reader keys, and single-key shortcuts can be turned off (WCAG 2.1.4).
- **Long forms keep drafts.** A whole-record save sends a version, so a conflicting edit is shown, not overwritten (forms.md).

## Permissions and tenancy
- **The API enforces permissions; the UI only reflects them.** Hide or disable what the user can't do (saying why when it's disabled); never rely on that hiding.
- **Multi-tenant:**
  - the tenant comes from the session or the URL;
  - caches and drafts are keyed by tenant and user;
  - switching tenant clears client state, so one customer's data never shows in another's view.
- **Sensitive actions** (delete, bulk change, role change) ask for confirmation and are recorded by the API. Show the audit history on the record if the product has one.

## Long sessions
- **Handle version skew, the back/forward cache and session expiry mid-work** (resilience.md, "Long-lived tabs").
- **Keep data fresh:** refresh after writes, pause polling while the tab is hidden, and catch up when it is shown.
- **Watch memory over a full working day** (memory.md).

## Data out
- **CSV exports** use the current filters, quote every field and escape formula cells (security.md), and start with a UTF-8 byte-order mark for Excel (leave it off for machine-read exports).
- **Printing:** a screen meant to be printed gets `@media print` rules that hide the navigation and buttons.
- **The app stays out of search engines** (`noindex`), and personal data stays out of logs and analytics (security.md).
