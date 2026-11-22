# Components: how each kind is built

Build components with the component library (libraries.md); these rules say what the finished component must do. Form fields are in forms.md. Visual style (tokens, palette, motion) comes from ui-ux-impeccable.

## Contents
- Every component: the state matrix
- Every data view: four more states
- Buttons and links
- Selects, comboboxes and pickers
- Dialogs, drawers and sheets
- Menus, popovers and tooltips
- Tables and data grids
- Lists, cards and long collections
- Navigation and tabs
- Toasts, banners and notifications
- Search
- Pagination, infinite scroll, "load more"
- File upload
- Charts and numbers
- Dates and times on screen
- Images, avatars and icons
- Copy
- Signs of an unfinished, generated-looking UI

## Every component: the state matrix

Every interactive element has each of these states designed and checked:

- default, hover, focus-visible, active/pressed, selected (where it applies);
- disabled, with the reason given beside it: a disabled control with no explanation is a dead end;
- loading, for anything async: a busy label ("Saving…"), with a second press ignored;
- error, where it applies.

A component designed only in its default and disabled states is half done.

## Every data view: four more states

1. **Loading:** a skeleton shaped like the final layout, so nothing shifts when the data arrives. Not a lone spinner.
2. **Empty:** says why it's empty and what to do next ("No invoices yet. Create one"). After a filter, it says "No results for X" and offers to clear the filters.
3. **Error:** plain words, what to do, and a Try again button. Never a raw code.
4. **No access:** says so, or redirects. Never a broken half-page.

Also handle partial data (one widget failed) and stale data: keep showing the old data with an "updating" indicator rather than blanking the screen.

## Buttons and links

- **A button acts; a link navigates.** A row or card that opens a record has a real link inside it; a click on the whole row is only a mouse shortcut for that link.
- **The label says what happens:** "Save changes", "Delete invoice", not "OK" or "Submit".
- **One primary action per view.** Destructive actions use the danger variant and ask first, or offer Undo.
- **An icon-only button has an `aria-label`** that names the action ("Delete row"), not the icon.

## Selects, comboboxes and pickers

| Options | Use |
|---|---|
| 2–5, all visible at once | Radio group or segmented control |
| Up to about 10, no search needed | Native `<select>` (the phone shows its own picker) or the library's Select |
| More, or the user knows what to type | A combobox with search (library) |
| Thousands (people, products, accounts) | A combobox that searches the server once typing pauses, showing a capped number of matches and saying when more exist |
| Several values | A multi-select: the chosen values as removable chips, and the list stays open while picking |

- **Options are options** (`role="option"` from the library), never buttons, so the field keeps focus and screen readers hear a listbox.
- **Long lists are capped or virtualized,** never rendered whole.
- **Offer "Create X" when nothing matches,** if creating is allowed.
- **Opening on a touch screen doesn't raise the keyboard** unless typing is the point (mobile-touch.md).

## Dialogs, drawers and sheets

- **Pick by the job:**
  - a **dialog** for a decision or a short form;
  - a **drawer** for a longer side task that keeps the page in view;
  - a **full-screen dialog or bottom sheet** on phones;
  - a **new page** for anything long enough to need its own URL.
- **Focus goes in on open,** stays inside, and returns to the opener on close. The rest of the page is inert and its scrolling is locked. The library does all of this; set initial focus its way (`initialFocus` in Base UI, `onOpenAutoFocus` in Radix, `autoFocus` on the target child in React Aria) and apply the touch rule in mobile-touch.md.
- **Escape and the close button always close it.** A click on the backdrop closes it only when nothing typed would be lost.
- **Closing with unsaved changes asks first,** or keeps a draft.
- **Avoid stacking dialogs.** The exception is a short alert dialog (the library's AlertDialog) confirming a discard or destructive action started inside a dialog. Otherwise replace the content, or use a step.
- **A confirmation names the action and its target** ("Delete 3 invoices?"). The buttons repeat the verb ("Delete", "Cancel"); the safe one is the default.
- **The more severe the action, the harder it is to do by accident:** Undo for small things, a confirmation for bigger ones, typing the name for irreversible ones.

## Menus, popovers and tooltips

- **A menu of actions is a menu button** (`menu` and `menuitem` from the library), opened by click, never by hover.
- **A tooltip only adds to what is already visible;** it never holds essential information. It appears on hover and keyboard focus, stays while the pointer is over the trigger or tooltip and while focus stays on the trigger, never hides on a timer, and closes on Escape (WCAG 1.4.13).
- **Never put a tooltip on a disabled button:** it can't receive focus. Show the reason as visible text instead.
- **On touch screens there is no hover,** so anything a tooltip says is also reachable by a tap.

## Tables and data grids

Use a semantic `<table>`: a `caption`, or a heading tied to the table with `aria-labelledby`, and `th` with `scope`. Use a grid widget with arrow-key navigation only when the cells themselves are editable or interactive. For headless table logic, use TanStack Table (libraries.md).

**Content**
- **Text left-aligned; quantities right-aligned** (amounts, counts, percentages) with `font-variant-numeric: tabular-nums`, so digits line up.
- **The same precision in every row** of a column. A single-currency column may put the currency in the header ("Amount (₹)") and format cells as plain numbers with that currency's decimals; a mixed-currency column formats each cell with its own currency. Never both.
- **Long text is truncated with an ellipsis,** and the full value is still reachable by mouse, keyboard and touch (the detail view, or an accessible tooltip on a focusable element; a `title` alone doesn't count). An id is never truncated.
- **Negative and positive values** show a sign or label as well as colour.
- **An empty cell shows a dash,** not nothing, so it doesn't look like a loading error.

**Structure**
- **Sticky header;** a frozen first column on wide tables.
- **On phones:** horizontal scroll inside the table's own container (never the page), or a card layout for a few key columns. A scroll container gets `tabindex="0"`, `role="region"` and a label, so keyboard users can scroll it.
- **A density setting** (compact or comfortable) and column show, hide and reorder for heavy users, each remembered per user.

**Sorting, filtering and paging**
- Each sortable header holds a `<button>`; `aria-sort` goes only on the `th` of the column currently sorted.
- When the browser holds only one page of the rows (large sets, or rows the server filters by permission), sorting, filtering and paging all happen on the server: the table library runs in manual mode, and filter input is debounced.
- Sort, filter, page and page size live in the URL.
- Paging shows the total ("1–50 of 1,284").

**Selection and bulk actions**
- **Checkboxes stay visible.** Each has a 24px hit area (through its label) and an accessible name ("Select Acme Ltd").
- **Selecting rows shows a bulk-action bar** with the count. "Select all on this page" is a separate choice from "Select all 1,284 matching".
- **A bulk action reports partial failure** ("48 updated, 2 failed: …"), never just "Done".

**Row actions**
- The primary action is a link or button in the row; secondary ones sit in a menu at the row's end.
- A repeated "Edit" says which row it edits, through visually hidden text.

**While loading**
- Keep the old rows visible with a progress indicator. Never collapse the table to a spinner, which makes the page jump.

**Export**
- An export uses the current filters and is safe against formula injection (security.md).

## Lists, cards and long collections

- **`key` is the record's id,** never the array index of a list that can change.
- **Page long lists.** If one can't be paged, try CSS `content-visibility: auto` with `contain-intrinsic-size` first; it skips layout and paint but not DOM creation, so use virtualization (TanStack Virtual) for thousands of items.
- **Cards differ in visual weight** so the eye knows where to start; a grid of identical cards has no hierarchy.

## Navigation and tabs

| Navigation | Fits |
|---|---|
| Top nav | Up to about 5–7 sections; marketing and content sites |
| Sidebar | Deeper structure; tools and dashboards used for long sessions (collapsible) |
| Bottom tab bar | Phones, with 3–5 permanent destinations |
| Command palette | Power users with many destinations; an addition to the above, never a replacement |

- **Mark the current page** with `aria-current="page"`. Page titles match the nav labels, and deep pages get breadcrumbs.
- **Group items in chunks of 5–9.** Past that, add a sub-level.
- **Tabs switch views of the same thing** (`tablist`, `tab`, `tabpanel`). Never use them for steps in a sequence: that is a stepper. If a link should open on a tab, the active tab is in the URL.

## Toasts, banners and notifications

- **A toast confirms something that already happened** ("Invoice sent. Undo"). It is announced politely (`aria-live`), stays at least 5 seconds, and pauses while hovered or focused. A toast with an action (Undo) stays long enough to use it.
- **An error that needs action is never only a toast,** because toasts vanish. Show it inline or in a banner that stays.
- **A banner that appears on its own** is fixed-position or reserves its space, so it doesn't push the content down.
- **Notification centres** group, mark read, and link to the thing that changed.

## Search

- **Debounce typing** (150–300 ms), abort the previous request, and ignore answers that arrive out of order.
- **Show the match count,** and highlight the matched text.
- **The empty state suggests what to do next.** The query lives in the URL.
- **A global search or palette opens with Ctrl/⌘+K,** listed in the UI. A single-key shortcut such as `/` can be turned off (WCAG 2.1.4) and never fires while typing in a field.

## Pagination, infinite scroll, "load more"

- **Pagination** for tasks: finding, comparing, coming back to a position. It is link-addressable.
- **"Load more"** for browsing feeds. Keep the scroll position when the user comes back.
- **Infinite scroll** only for endless feeds with no footer anyone needs. Announce new items, and keep the footer reachable.

## File upload

- **A button and drag-and-drop together.** Drag is never the only way (WCAG 2.5.7).
- **Check type and size in the browser to help the user;** the server enforces them.
- **Show progress per file, and allow cancel and retry.** Big files go straight to storage through a signed URL, never through the app server's request limit. `fetch()` reports no upload progress: use `XMLHttpRequest` (`upload.onprogress`, `abort()`) or Uppy, and allow the app's origin in the bucket's CORS rules.
- **Show what will happen before it does** (preview, file name, size). Revoke the object URL of a preview when you're done with it (memory.md).

## Charts and numbers

- **Use a chart library** (libraries.md), and the dataviz skill for colour and form.
- **Give the same numbers as a table or a summary sentence** for screen readers. Never use colour alone: add labels or patterns.
- **Large numbers** use the locale's grouping (`Intl.NumberFormat`), tabular figures in columns, and units always.
- **Destroy chart instances on unmount** (memory.md), and respect reduced motion.

## Dates and times on screen

- **Show relative time ("3 min ago") with the absolute time available** (a title, or a `<time datetime>`).
- **Show the time zone whenever it could be misread.** Format through one module using `Intl`, with an explicit locale and zone (the server and browser must match).

## Images, avatars and icons

- **Meaningful images get `alt` text describing their purpose;** decorative ones get `alt=""`. Images are sized (width and height) so nothing shifts.
- **Avatars fall back to initials,** not a grey circle.
- **One icon family with one stroke weight.** Never use emoji in place of icons.

## Copy

- **Buttons are verbs naming the result.** Errors say what happened and what to do next. Empty states say what to do first.
- **The same word for the same thing everywhere.** Use "…", not "...".
- **Read every string aloud.** If it sounds like a form generator ("An error has occurred", "No data available"), rewrite it.

## Signs of an unfinished, generated-looking UI

Fix these before shipping:
- a default gradient blob or glassmorphism used everywhere;
- identical cards with no hierarchy;
- everything centred;
- emoji used as icons;
- grey placeholder avatars;
- lorem ipsum;
- every button in the same saturated fill;
- a missing favicon, `<title>` or Open Graph tags.

The full design pass is in ui-ux-impeccable.

Sources: ui-ux-impeccable (component inventory, the Impeccable Standard, accessibility essentials) · [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) · [Data table design patterns](https://bootcamp.uxdesign.cc/data-table-design-patterns-4e38188a0981) · [Data table UI reference](https://www.setproduct.com/blog/data-table-ui-design) · [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)
