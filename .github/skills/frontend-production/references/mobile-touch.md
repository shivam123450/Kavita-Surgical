# Mobile and touch

## Contents
- Viewport and zoom
- Detecting touch
- Viewport height and the on-screen keyboard
- When the keyboard opens
- Hit areas and reach
- Safe areas, overscroll and landscape
- iOS quirks
- Installed web apps
- Testing

## Viewport and zoom

1. **Use `<meta name="viewport" content="width=device-width, initial-scale=1, interactive-widget=resizes-content">`.**
2. **Never use `maximum-scale` or `user-scalable=no`.** They block zoom for people who need it (WCAG 1.4.4).
3. **Text fields are at least 16px on touch screens.** iOS Safari zooms the page when a smaller field is focused. One rule covers every field; keep it outside any `@layer`, and add `!important` if class-based font sizes would override it:

   ```css
   @media (pointer: coarse) {
     input, select, textarea { font-size: 16px; }
   }
   ```

## Detecting touch

- **Use `(pointer: coarse)`, the same test in CSS and JavaScript.** Use `(hover: hover)` for hover-only effects. Never treat screen width as a stand-in for touch.
- **In JavaScript, read `matchMedia` only in an Effect or event handler.** The server has no window, so a render that read it would differ from the server's. A small helper:

  ```ts
  export const isCoarsePointer = () =>
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  ```
- **Nothing is hover-only.** Whatever hover reveals is also reachable by focus and by tap.

## Viewport height and the on-screen keyboard

1. **On phones, `100vh` includes the area behind the browser bars.**
   - Use `svh` for page layouts, which stay put as the bars hide.
   - Use `dvh` for overlays that should follow the browser bars as they show and hide (it doesn't shrink for the keyboard, except on Android with `resizes-content`).
   - Keep a `vh` line just before each one as a fallback: `min-height: 100vh; min-height: 100svh;`.
2. **`interactive-widget=resizes-content`** makes Chromium browsers and Firefox on Android shrink the layout when the keyboard opens. Safari on iOS ignores it. Check fixed bottom bars and full-screen dialogs with the keyboard up on a real iPhone; `window.visualViewport` reports the space left.
3. **A focused field must not hide under a sticky header or bottom bar:** set `scroll-padding` on `html`.

## When the keyboard opens

The keyboard covers about half the screen. Apple's WebKit team calls one raised automatically "annoying and a distraction", and iOS shows it for a programmatic `focus()` only during a user gesture (the tap's own handler, not after an awaited import or a delay), when the keyboard is already up, or with a hardware keyboard.

- **No autofocus when a page loads on a touch screen.** Focus the first field only when the pointer isn't coarse.
- **A picker that shows a list first, or a drawer that opens on a form,** focuses its own container on touch (`tabIndex={-1}`, a role and a label). With a mouse, it focuses the field. A focused container must still answer the arrow keys, Enter and Escape.
- **Keep the field focused where the tap clearly asked to type:** a search icon, a command palette, rename, "type the name to confirm". Android's own search screen raises the keyboard the same way.
- **Use the dialog library's initial-focus option.** A focus trap usually overrides `autoFocus`.

## Hit areas and reach

- **Targets are at least 24 × 24 CSS px** (WCAG 2.5.8 AA). Aim for 44 × 44 (Apple) or 48dp (Material) on primary touch controls.
- **Grow the hit area, not the look:** padding, the label, or an invisible control laid over a small visual. Space adjacent targets apart.
- **Thumbs reach the lower middle of the screen most easily; the top corners are hardest.** Put frequent actions low (bottom bar, sheet), clear of the gesture bar, and keep destructive ones away from accidental taps.

## Safe areas, overscroll and landscape

- **Pad fixed bars with `env(safe-area-inset-bottom, 0px)`** (and `-top`). On iOS the insets are 0 unless the viewport has `viewport-fit=cover`, but Android Chrome can draw edge to edge, so pad either way.
- **Sheets and scroll areas inside overlays get `overscroll-behavior: contain`,** so scrolling doesn't carry on into the page behind. Lock the body's scroll under a modal (the library does this).
- **A phone on its side is about 375px tall.** Popovers and sheets must fit; `(pointer: coarse) and (max-height: 500px)` targets that layout. Content works in both orientations (WCAG 1.3.4).

## iOS quirks

- **Safari turns phone numbers and emails into links,** which changes the page under React and causes hydration errors. Add `<meta name="format-detection" content="telephone=no, date=no, email=no, address=no">` (Next.js: `metadata.formatDetection`), and link numbers on purpose with `tel:`.
- **Autoplay** needs `muted` and, on iPhone, `playsinline`. It can still be refused (Low Power Mode, data saver), so `.catch()` the `play()` promise and fall back to the poster.
- **`position: fixed` inside a scrolling element,** and bars at the bottom of the viewport, behave differently when the keyboard is up. Test them on a device.

## Installed web apps

- **The home-screen app has no back button:** every screen needs its own way back.
- **Ask for permissions** (notifications, camera, location) in context, right before the feature that needs them, with a one-line reason. Never on first load.
- **A deep link opens the exact screen,** not the home screen.

## Testing

1. **Emulation catches regressions.** Playwright with `hasTouch` and `isMobile` (or a device descriptor) in Chromium and WebKit; Firefox supports `isMobile` only in recent Playwright versions, so check yours. Assert `matchMedia("(pointer: coarse)")` first, so the test proves it ran as touch.
2. **Real devices before release:** an iPhone in Safari (and the home-screen app, if supported) and an Android phone in Chrome. Check the keyboard with fixed bars and dialogs, zoom on focus, the phone on its side, and the safe areas.
3. **Widths to check:** about 375, 768 and 1440px, plus 320px for reflow.

Sources: [WebKit bug 195884](https://bugs.webkit.org/show_bug.cgi?id=195884) · [MDN autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autofocus) · [MDN viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport) · [Material Search](https://github.com/material-components/material-components-android/blob/1.9.0/docs/components/Search.md) · [Baymard: mobile touch keyboards](https://baymard.com/blog/mobile-touch-keyboards) · [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) · ui-ux-impeccable (mobile and app platforms)
