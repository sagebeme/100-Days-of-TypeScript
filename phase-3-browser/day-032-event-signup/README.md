# Day 32: Event Sign-up Form — FormData and Validation

Watch the video: *(not recorded yet)*

## The brief

There's a rooftop listening party on Saturday and you're taking the sign-ups. Build the form: name, email, phone number, ticket type and how many guests. When someone gets something wrong, show them which field and why, right next to it. When everything is right, confirm it and clear the form.

```
parseSignup(formData)  →  { ok: true, value: { name: "Amina", phone: "+254712345678", ticket: "vip", guests: 2, ... } }
parseSignup(formData)  →  { ok: false, errors: { email: "Enter a valid email", guests: "Guests must be 0 to 3" } }

normalizePhone("0712 345 678")    →  "+254712345678"
normalizePhone("+254 110 123456") →  "+254110123456"
normalizePhone("12345")           →  null
```

## What you'll use

- `new FormData(form)`, which collects every named field of a form at once
- `data.get("email")`, which returns `FormDataEntryValue | null`. That's `string | File | null`, because a form can upload files. You narrow it to a string before you use it
- The `Result` shape from Day 21, with one error message **per field**: `Partial<Record<keyof Signup, string>>`
- `as const` on a list of tickets, and a type guard that checks a string is one of them
- `novalidate` on the `<form>`, so the browser's own pop-up checks step aside for yours
- `aria-invalid` and `aria-describedby`, so a screen reader announces the error with the field

## Steps

1. Start the dev server and look at the form:

   ```bash
   npm run dev -- phase-3-browser/day-032-event-signup/starter
   ```

   Every field has a `name`. Every error slot has `data-error-for="<that name>"`.
2. In `starter/signup.ts`, write `normalizePhone(raw)`. Remove spaces and dashes first. Then accept `07…` or `01…` with 10 digits, and `254…` or `+254…` followed by `7` or `1` and 8 more digits. Return the number as `+254` plus 9 digits, or `null` if it doesn't fit.
3. `isTicket(value)`: a type guard that's `true` for `"regular"`, `"vip"` or `"student"`. Use the `TICKETS` list.
4. `parseSignup(data)`: read each field as trimmed text (anything that isn't a string counts as `""`), then check it:

   | Field | Rule | Error |
   | --- | --- | --- |
   | `name` | at least 2 characters | `Enter your name` |
   | `email` | something@something.something, no spaces | `Enter a valid email` |
   | `phone` | `normalizePhone` doesn't return `null` | `Enter a Kenyan number like 0712 345 678` |
   | `ticket` | `isTicket` | `Pick a ticket type` |
   | `guests` | blank means 0, otherwise a whole number from 0 to 3 | `Guests must be 0 to 3` |

   Collect **every** error, not just the first one. Return `{ ok: true, value }` only if there are none.
5. In `starter/app.ts`, write `mountSignup(root, onSignup)`. On submit:
   - Stop the page reloading.
   - Clear the old errors: empty every `[data-error-for]` slot and remove `aria-invalid` from every field.
   - Parse. For each error, put the message in its slot, set `aria-invalid="true"` on the field, and focus the **first** field with an error.
   - On success, call `onSignup(value)`, reset the form, and show `You're in, Amina! VIP ticket, 2 guests.` in `#status`. (`1 guest` for one, `no guests` for zero.)
6. Run the tests:

   ```bash
   npm test -- day-032
   ```

## When you're stuck

- **`Argument of type 'FormDataEntryValue' is not assignable to parameter of type 'string'`** — the value could be a `File`. Check `typeof value === "string"` first.
- **The browser shows its own "Please fill in this field" bubble** — you're missing `novalidate`, or a field has `required`. Today *you* do the checking.
- **Only the first error shows** — you returned early. Put every message in the `errors` object and return at the end.
- **The old error is still there after fixing the field** — clear all the slots at the start of every submit.
- **`focus()` doesn't exist on `Element`** — narrow to `HTMLElement` with `instanceof` first.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
