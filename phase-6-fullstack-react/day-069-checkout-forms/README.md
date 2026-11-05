# Day 69: Checkout — Forms That Share the API's Schema

Watch the video: *(not recorded yet)*

## The brief

The cart is full; now the fan pays. The checkout form asks for a name, an email and an M-Pesa number, then sends the order to the API, which pushes the "enter your PIN" prompt to their phone.

A checkout form is where a small mistake costs real money. Mistyped phone numbers mean an M-Pesa prompt goes to a stranger. Errors a person can't understand mean an abandoned sale. So this form:

- **accepts numbers however people write them**: `0712 345 678`, `+254712345678` and `0712-345-678` are all the same number;
- **says what to do, not what's wrong**: "Enter a Safaricom number like 0712 345 678", not "Invalid input";
- **puts the cursor on the first problem** when you press Pay, and clears each error the moment it's fixed;
- **shows the server's answer where it belongs**: a problem with the phone on the phone field, "sold out" above the form;
- **can't be sent twice** while the first request is on its way.

## One schema, two places

`schemas.ts` is the only definition of a valid order. The form uses it through React Hook Form's `zodResolver`. The pretend API in `vite.config.ts`, running on the dev server, imports the *same file* to check what arrives. The browser's checks are for the fan's convenience; the server's are for safety, because anyone can send anything to an API. Sharing one schema means they can never drift apart.

The schema also *tidies*. It turns what was typed (`z.input`: `"0712 345 678"`) into what's stored (`z.output`: `"254712345678"`), so the rest of the code only ever sees one form of phone number.

## What you'll use

- **Zod**: `.transform` with a custom issue, `.pipe`, `z.literal(true)`, `.extend`, and `z.input` / `z.output`
- **React Hook Form**: `useForm`, `register`, `handleSubmit`, `formState.errors`, `isSubmitting`, `setError`, `setFocus`
- **Accessible fields**: every input has a `<label>`, and `aria-describedby` points at its hint and error. `aria-invalid` marks the broken ones
- **The right keyboard**: `type="tel"` brings up the number pad on a phone; `autocomplete` lets the browser fill in what it knows

## Steps

1. Run it: `npx vite phase-6-fullstack-react/day-069-checkout-forms/starter`. The pretend API answers at `/api/orders`, slowly, so you can watch the button change.
2. `starter/schemas.ts`: `SafaricomPhone`, `CheckoutSchema` and `fieldErrors`. `npm test -- day-069 -t schema`.
3. `starter/api.ts`: `createOrder`, which turns every possible answer into an `OrderResult`.
4. `starter/Field.tsx`: the label, hint and error, tied to the input.
5. `starter/CheckoutForm.tsx`: the form itself.
6. Try the unhappy paths for real: an empty form, `0700 000 000` (M-Pesa is "down"), and then run everything:

   ```bash
   npm test -- day-069
   ```

## Two lessons from building this

**Don't check each box as it loses focus.** It sounds friendly, but when you click Pay, the email box loses focus first, its error appears, the button moves down under your finger, and the click misses. The fan clicks Pay and nothing happens. So the form checks on submit, then re-checks on every change (`mode: "onSubmit"`, `reValidateMode: "onChange"`).

**Registration order is focus order.** React Hook Form puts the cursor on the first bad field *in the order fields were registered*. Inputs inside a `Field` render prop register when `Field` renders, which is *after* anything written directly in the form, so the checkbox would win. Register all four at the top of the component, in page order.

## Check yourself

1. The same `CheckoutSchema` runs in the browser and on the server. Why check on the server at all if the form already checks?
2. Predict the output: `CheckoutSchema.parse({ name: "Amina", email: " Amina@Example.com ", phone: "0712-345-678", agree: true })`
3. What's the difference between `z.input<typeof CheckoutSchema>` and `z.output<typeof CheckoutSchema>` for `phone`?
4. Why does the form check on submit and then on every change, instead of checking each box as it loses focus?

<details><summary>Answers</summary>

1. Anyone can send anything to an API, without your form. The browser's checks are for the fan's convenience; the server's are for safety. Sharing one schema means they can't disagree.
2. `{ name: "Amina", email: "amina@example.com", phone: "254712345678", agree: true }`. The schema tidies as it checks: trimmed and lower-cased email, one form of phone number.
3. The input is the phone as typed (`"0712 345 678"`). The output is what's stored (`"254712345678"`). The form holds the first; everything after the check sees only the second.
4. Clicking Pay makes the email box lose focus first. Its error appears, the button moves down under the finger, and the click misses. Checking on submit avoids that; re-checking on change clears each error as soon as it's fixed.

</details>

## When you're stuck

- **The phone always fails** — remove spaces and dashes *before* matching, and allow `0`, `254` or `+254` in front of a number starting with 7 or 1.
- **`Amina@Example.com ` fails the email check** — trim and lowercase first, then `.pipe(z.email(...))`. Checking first rejects the space.
- **The checkbox error says "Invalid input"** — pass the message as `z.literal(true, "Tick the box…")`, so it covers a missing value as well as `false`.
- **The server's error doesn't show** — `setError` needs the field's name; errors that aren't about a field go on `"root.server"`, which you show as the alert.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
