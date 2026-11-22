# Forms

## Contents
- Fields and labels
- The right keyboard and autofill
- Validation and errors
- Submitting
- Protecting typed work
- Long and multi-step forms
- Sign-in and sensitive fields

## Fields and labels

1. **Every field has a visible label,** tied to it with `for` and `id`. A placeholder is not a label: it disappears as you type and usually fails contrast.
2. **The hint and error are linked with `aria-describedby`;** `aria-invalid` is set while the field is in error.
3. **Mark whichever is rarer:** "required" or "optional". Say it in text, not only with an asterisk. Required fields also carry `required` or `aria-required="true"`.
4. **Group related fields** under a `fieldset` and `legend`, or a heading. The field's width hints at the expected length.
5. **Use radios for 2–5 visible choices,** a checkbox for one yes/no, and a switch only for a setting that takes effect immediately.

## The right keyboard and autofill

| Field | Attributes |
|---|---|
| Email | `type="email"` `autoComplete="email"` |
| Phone | `type="tel"` `inputMode="tel"` `autoComplete="tel"` |
| One-time code | One `<input>` (not a box per digit) with `inputMode="numeric"` `autoComplete="one-time-code"`, accepting paste |
| Reusable PIN | `type="password"` `inputMode="numeric"` |
| Count or amount | `inputMode="numeric"` or `"decimal"`; avoid `type="number"` for money and ids (its spinners and scroll-wheel changes cause mistakes); parse with the user's locale, and add a +/− control where values can be negative (iOS numeric keyboards have no minus) |
| Search | `type="search"` or `enterKeyHint="search"` |
| Username | `autoComplete="username"` `autoCapitalize="none"` `autoCorrect="off"` `spellCheck={false}` |
| Names | `autoCapitalize="words"`, plus the right token (`name`, `given-name`) |
| Address | `address-line1`, `address-line2` (or `street-address` on one textarea), `address-level2` (city), `postal-code`, `country` |

- **`enterKeyHint`:** `next` on fields that have another after them; `go`, `done` or `send` on the last. It only changes the key's label: on a `next` field, handle Enter yourself (move focus to the next field, `preventDefault`), or Enter submits the form.
- **Turn off autocorrect and autocapitalise** for codes, ids, search and anything a dictionary doesn't know.
- **The user's own details** get the correct `autocomplete` token. **A field about someone else** (a client record in a CRM) gets `autoComplete="off"`; Chrome may ignore `off` for address and contact autofill, so if it still offers the user's details, use a value it doesn't recognise. **A password set for someone else** keeps `new-password` and carries `data-1p-ignore` (1Password) and `data-lpignore="true"` (LastPass), so those managers don't fill or save it. Other managers may ignore such hints; check the ones your users run.
- **Never ask again for what the system already knows:** prefill from the account.

## Validation and errors

1. **Validate in the browser to help, on the server to decide.** Share one schema (Zod) where you can.
2. **Show a field's error when the user leaves the field** (on blur), not on every keystroke. Clear it as soon as they correct it.
3. **An error sits right under its field and says what to do:** "Enter a date after 1 Jan 2026", not "Invalid input".
4. **After a failed submit, focus the first invalid field;** on a long form, show an error summary at the top (`tabIndex={-1}`, linking to each field) and focus it instead.
5. **A server error is mapped to its field when it names one;** otherwise it is shown above the submit button, in the server's own words.
6. **Don't disable the submit button to stop an invalid form:** let the press show the errors. Put `noValidate` on the form so your own messages show instead of the browser's popups, and check each field's `validity` yourself.

## Submitting

1. **The submit button stays enabled until the request starts,** then shows a busy label and ignores further presses.
2. **A payment or other irreversible write carries an idempotency key,** created once per intended operation (when the form opens) and reused by every retry, so a retry or double tap can't run it twice.
3. **After success, say what happened and where it went.** Move focus somewhere sensible, not to the top of the page.
4. **Never block paste.** Never clear what was typed after a failure, except a password.

## Protecting typed work

1. **Warn before leaving with unsaved changes:** a `beforeunload` listener only while the form is dirty, plus a guard on in-app navigation.
2. **Keep a draft in `localStorage` for long forms,** keyed by user, tenant and record. It is versioned, expires, has every access in `try`/`catch` (storage throws in private windows and when full), is deleted at sign-out, and never holds a password or card number.
3. **Autosave long content** and show its status ("Saving…", "Saved 2 min ago").
4. **A save that would overwrite a newer version is detected,** by sending a version or `updatedAt`, and the conflict is shown rather than overwritten.

## Long and multi-step forms

- **Past about 7–8 fields,** group them into sections or steps, with a progress indicator ("Step 2 of 4").
- **Back keeps what was entered.** Each step validates before moving on, and the last step shows a review of everything before submitting.
- **Each step has its own URL,** so Back and reload work.
- **Avoid input masks** that fight typing and pasting. If you format, do it on blur and accept any format the user pastes.

## Sign-in and sensitive fields

- **Sign-in is its own `<form>`.** Its fields have stable `name` and `id`, use the `username` (`username webauthn` when passkeys are offered) and `current-password` tokens, and aren't autofocused on touch screens.
- **Paste and password managers work, and there is no puzzle** (WCAG 3.3.8). One-time codes accept paste and use `one-time-code`.
- **Show or hide the password with a button.** Never clear a password the user is typing.
- **Card numbers go in your payment provider's hosted fields,** which cuts your PCI DSS scope; the page that embeds them is still in scope for its scripts (app-types/banking-payments.md).

Sources: [Chrome: sign-in form best practice](https://developer.chrome.com/docs/modern-web-guidance/guides/forms/autofill-sign-in-form) · [Baymard: mobile touch keyboards](https://baymard.com/blog/mobile-touch-keyboards) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · ui-ux-impeccable (forms and validation)
