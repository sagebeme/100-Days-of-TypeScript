# Day 1: M-Pesa SMS Builder

Watch the video: *(not recorded yet)*

## The brief

Send money on M-Pesa and a text arrives a second later: a transaction code, the word "Confirmed", the amount, and who got it. Write a function that builds that confirmation from its three parts.

```
buildConfirmation("QFT1ABC2DE", 500, "Amina Wanjiru")
  →  "QFT1ABC2DE Confirmed. Ksh500.00 sent to Amina Wanjiru."

buildConfirmation("RKD4XY7Z1P", 1250, "Kip")
  →  "RKD4XY7Z1P Confirmed. Ksh1250.00 sent to Kip."
```

*This is a simplified version of the real text: real messages also add commas to big amounts, the recipient's phone number, the date and time, and your new balance. You'll format numbers properly later in the course.*

## What you'll use

- `const` for a value that never changes once you set it
- `let` for a value you build up in more than one step
- Template strings (`` `${...}` ``) to combine text and variables, instead of gluing pieces together with `+`

## Steps

1. Open `starter/mpesa-sms.ts`.
2. Declare two `const`s: `status` holding `"Confirmed."`, and `currency` holding `"Ksh"`.
3. Declare a `let` called `message`, starting as `` `${code} ${status}` ``: the code, a space, then the status.
4. Reassign `message` to add the rest onto the end: a space, the currency stuck to the amount, `.00`, then ` sent to ` and the name, and a full stop.
5. Return `message`.
6. Run the tests.

```bash
npm test -- day-001
```

## Check yourself

1. Why is `message` a `let` while `status` and `currency` are `const`s?
2. Predict the output: `buildConfirmation("AB12", 99.5, "Wanjiru")`
3. Spot the bug:
   ```ts
   const message = `${code} ${status}`;
   message = `${message} ${currency}${amount}.00 sent to ${name}.`;
   ```
4. `amount` is a `number`. What does `${amount}` do with it inside a template string?

<details><summary>Answers</summary>

1. `message` is reassigned in a second step, and only a `let` can be reassigned. `status` and `currency` never change, so `const` says so and stops anyone changing them by accident.
2. `"AB12 Confirmed. Ksh99.5.00 sent to Wanjiru."` Sticking `.00` on the end only works for whole amounts. Formatting money properly comes later in the course.
3. `message` is a `const`, so the second line is an error: "Cannot assign to 'message' because it is a constant." Make it a `let`.
4. It turns the number into text (`500` becomes `"500"`) and drops it into the string. No `String(...)` or `+` needed.

</details>

## When you're stuck

- **"Cannot find name 'code'" or similar**: check the function's parameter list in `starter/mpesa-sms.ts`. Don't rename or reorder the parameters; the tests call the function by its exact name with the code, the amount and the name, in that order.
- **The code and "Confirmed." are missing from the result**: when you reassign `message`, the new template string has to start with `${message}`. `let` reassignment replaces the whole value; it doesn't append unless you include the old value in the new one.
- **The test shows `Ksh 500.00` or `Ksh500`**: compare your spaces with the brief character by character. There's no space between `Ksh` and the amount, and `.00` is plain text after `${amount}`.
- **Still stuck?** Open `solution/mpesa-sms.ts`, read it once, close it, then write your own version from memory. Copying it in doesn't teach you anything the test couldn't already tell you.
