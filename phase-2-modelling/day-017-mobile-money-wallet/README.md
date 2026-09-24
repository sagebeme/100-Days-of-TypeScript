# Day 17: Mobile Money Wallet — Classes

Watch the video: *(not recorded yet)*

## The brief

Model a mobile-money wallet the way an M-Pesa-style app would. A wallet has an owner and a balance. You can deposit money and send money to another wallet. Nobody outside the class should be able to just set the balance to a million.

```
const amina = new MobileWallet("Amina", 500);
const kip = new MobileWallet("Kip");
amina.send(200, kip);
amina.balance  →  300
kip.balance    →  200
amina.send(1000, kip)  →  throws "Insufficient funds"
```

## What you'll use

- `class`, with a `constructor` and methods
- `readonly owner`: the owner can be read but not reassigned (checked by the compiler)
- `#balanceCents`: a **truly private** field. Code outside the class can't read or write it at all
- A getter (`get balance()`) to expose a read-only view of the private value
- Storing money as whole **cents** instead of decimals, because `0.1 + 0.2` is `0.30000000000000004` in JavaScript

## Steps

1. Open `starter/mobile-wallet.ts`. The fields are already declared. Notice `readonly owner: string;` and `#balanceCents = 0;`.
2. In the `constructor`, set `this.owner = owner` and `this.#balanceCents = Math.round(openingBalance * 100)`.
3. Write the `balance` getter: return `this.#balanceCents / 100`.
4. Write `deposit(amount)`. If `amount <= 0`, throw `new Error("Amount must be positive")`. Otherwise add `Math.round(amount * 100)` to the private balance.
5. Write `send(amount, recipient)`. Validate the same way, then if `amount` in cents is more than the balance throw `new Error("Insufficient funds")`. Otherwise subtract it from this wallet and call `recipient.deposit(amount)`.
6. Run the tests:

   ```bash
   npm test -- day-017
   ```

7. **Try the compiler.** After the tests pass, add a line outside the class, like `amina.owner = "Someone Else"`, and see the error from `npm run typecheck`. Then try `amina.#balanceCents` and see that one too. Delete both lines.

## When you're stuck

- **"Property 'owner' has no initializer"** — a `readonly` field has to be assigned in the constructor. Write `this.owner = owner;`.
- **Why an explicit field and not `constructor(readonly owner: string)`?** That shorthand ("parameter properties") is not supported by Node's built-in TypeScript stripping. Declare the field, then assign it.
- **`balance` shows `0.30000000000000004`** — you're storing decimals. Store cents (whole numbers) and divide by 100 only when you read.
- **A failed `send` still took money** — check the balance *before* you subtract anything.
- **Still stuck?** Read `solution/mobile-wallet.ts`, then close it and write your own from memory.
