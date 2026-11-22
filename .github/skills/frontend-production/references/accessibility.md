# Accessibility (WCAG 2.2 AA)

## Contents
- The law
- Structure and semantics
- Keyboard and focus
- Names, announcements and colour
- Layout and motion
- Forms and sign-in
- Checking it

## The law

Build to **WCAG 2.2 AA**; it covers the common legal baselines:
- **EU:** the European Accessibility Act has applied since 28 June 2025 to e-commerce, consumer banking (web, apps, account opening, payments), passenger transport, electronic communications, access to audiovisual media services and e-books (microenterprises providing services are exempt). Its harmonised standard is EN 301 549 (version 3.2.1 references WCAG 2.1 AA; the newer version references WCAG 2.2), which also covers native apps.
- **US:** the ADA (courts look to WCAG 2.1 AA; the Title II rule requires it of state and local governments from April 2027) and Section 508 for federal work. **India:** the RPwD Act (which also covers private service providers), GIGW 3.0 for government sites, IS 17802 as the national ICT standard, and SEBI's digital-accessibility rules for securities-market apps.
- **Regulated and public sites:** publish an accessibility statement, with a way to report problems.

## Structure and semantics

1. **Use the element for the job:** `button` for actions, `a` for navigation, `table` for tabular data, real form controls, and the landmarks `header`, `nav`, `main` and `footer`. A clickable `div` is allowed only as a mouse shortcut for a real control inside it, or as an `aria-hidden` backdrop that Escape also closes.
2. **`<html lang>` is set** (and updated per locale). **One `h1` per screen,** headings in order, and a working skip link to `main`.
3. **Every page has a unique title** that names what's on it, including the record's name.
4. **Custom widgets come from an accessible primitive library** (libraries.md). Hand-written ARIA is a last resort, and must follow the ARIA Authoring Practices pattern exactly.

## Keyboard and focus

1. **Everything works with the keyboard alone:** Tab and Shift+Tab to move, Enter and Space to activate, Escape to close, arrow keys inside composite widgets. There are no keyboard traps.
2. **Focus is always visible** (`:focus-visible`, an outline with 3:1 contrast), and never hidden under sticky headers or footers (WCAG 2.4.11; use `scroll-padding`).
3. **Focus order follows reading order.** CSS reordering must not scramble it. Never use a positive `tabindex`.
4. **Dialogs and menus:** focus moves in on open, stays inside, and returns to the opener on close.
5. **When something disappears,** focus lands somewhere sensible: the next row, the list, or the opener. Never the top of the page.
6. **Actions run on click, not on press** (WCAG 2.5.2), so a slip can be dragged off. Changing a field never navigates by itself (WCAG 3.2.2).
7. **Every drag has a single-pointer alternative,** such as move buttons or a menu (WCAG 2.5.7), and also works from the keyboard (WCAG 2.1.1).

## Names, announcements and colour

1. **Every control has an accessible name that includes its visible label.** Icon-only buttons get `aria-label` naming the action.
2. **A repeated "Edit" or "Open" names its target** in visually hidden text.
3. **Changes the user can't see are announced** through a polite live region: save results, toasts, result counts, streamed output once it completes.
4. **Never rely on colour alone:** add text or an icon.
5. **Contrast:** 4.5:1 for text (3:1 for large text), and 3:1 for control borders, focus rings and meaningful graphics. Check both themes if there is a dark mode.
6. **Images:** meaningful ones get `alt` describing their purpose; decorative ones get `alt=""`. Video has captions, and audio description where needed.

## Layout and motion

1. **Reflow:** at 320 CSS px wide (the same as 400% zoom), nothing needs sideways scrolling except a table inside its own scroll box.
2. **Text spacing** (WCAG 1.4.12): nothing is clipped or overlaps with line height 1.5×, paragraph spacing 2×, letter spacing 0.12× and word spacing 0.16× the font size; avoid fixed heights on text containers. It works in both orientations, and in forced-colors (high-contrast) mode.
3. **Targets are at least 24 × 24 px** (WCAG 2.5.8; see mobile-touch.md).
4. **Content that appears on hover or focus** can be dismissed with Escape without moving the pointer or focus, can itself be hovered, and stays until the pointer or focus leaves or the user dismisses it (WCAG 1.4.13).
5. **Reduced motion:** every animation has a `prefers-reduced-motion: reduce` rule. Nothing flashes more than 3 times a second (WCAG 2.3.1), and anything that starts moving by itself and lasts more than 5 seconds can be paused, stopped or hidden (WCAG 2.2.2).
6. **Time limits** (session timeouts, timed offers) warn the user before they run out and let them extend (WCAG 2.2.1).

## Forms and sign-in

1. **Visible labels,** with errors tied to their fields, saying what to do. Focus moves to the first error after a failed submit (forms.md).
2. **Signing in is not a memory test** (WCAG 3.3.8): paste and password managers work, and there is no cognitive puzzle. Don't ask again for what was given earlier in the same flow (WCAG 3.3.7).
3. **Help is in the same place on every page** (WCAG 3.2.6).
4. **Legal, financial and data-deleting submissions** can be reviewed, corrected or reversed (WCAG 3.3.4).

## Checking it

- **Automated:** axe in the end-to-end tests (`@axe-core/playwright`) and lint (`jsx-a11y`, if it supports your ESLint version). These find only about half the problems.
- **By hand, for every new screen:**
  - keyboard only;
  - a screen reader: VoiceOver on an iPhone or Mac, NVDA on Windows;
  - 320px wide, and 200% zoom.
- **The four checks that catch most problems:**
  - Can the main task be done with the keyboard alone?
  - Does every status and error have a signal that isn't colour?
  - Does every icon-only control have a name?
  - Does body text pass 4.5:1 in both themes?

Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) · [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) · [European Accessibility Act overview](https://www.accessibility-developer-guide.com/knowledge/legal/eaa/) · [Deque: automated coverage](https://www.deque.com/automated-accessibility-testing-coverage/) · ui-ux-impeccable (accessibility essentials)
