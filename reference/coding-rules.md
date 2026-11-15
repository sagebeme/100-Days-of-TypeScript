# How we write code in this course

Ten habits, the same ones a team will expect from you at work. Read this once before Day 1 and come back whenever a day feels messy.

## Before you start

1. **Read the brief and say what "done" means.** Before you type, say it in one sentence: "`buildConfirmation` returns the text in the example, for any code, amount and name." If you can't, re-read the README. If it's still unclear, ask (open an issue) instead of guessing.
2. **Write only what the day asks for.** No extra options, features or "while I'm here" changes. Have an idea? Write it down for later, or try it in the day's *Stretch* section.

## While you write

3. **Keep functions small and clear.** One job per function, names that say what they hold (`totalKes`, not `t`). Before you finish, re-read your code: delete anything you added and no longer use.
4. **Change only what the task needs.** Don't rename, reorder or reformat code you weren't asked to touch, and don't rename the starter's functions or parameters: the tests call them by name. Match the style around you: same quotes, same naming, same way of handling errors.
5. **Comments say *why*, not *what*.** For a function other files use, a `/** */` comment says what it takes, what it returns and when it throws. Your editor shows it to whoever calls the function.

   ```ts
   // Bad: repeats the code
   // add one to count
   count += 1;

   /**
    * Splits a bill between friends, rounded up to the next shilling.
    * @param totalKes - the whole bill, in shillings
    * @param people - how many are paying; 1 or more
    * @returns what each person pays
    * @throws {RangeError} if `people` is less than 1
    */
   export function sharePerPerson(totalKes: number, people: number): number {
   ```

6. **Don't hide errors.** Never write an empty `catch {}` or catch an error just to carry on as if nothing happened. Either handle it (show a message, use a fallback, answer `400`) or let it reach the caller. What you catch is `unknown`: narrow it before you use it (Day 21). No `any` without a comment saying why, and no `// @ts-ignore`. Tests may use `// @ts-expect-error` with a reason, to prove the compiler rejects something.

   ```ts
   // Bad: the error vanishes, and so does your chance to fix it
   try { return JSON.parse(text); } catch {}

   // Good: say what went wrong, then pass it on
   try {
     return JSON.parse(text);
   } catch (error) {
     const reason = error instanceof Error ? error.message : String(error);
     throw new Error(`money.json is not valid JSON: ${reason}`);
   }
   ```

7. **Tests check results.** A test uses `expect(...)` and fails when the code is wrong. `console.log` shows you a value; it doesn't test anything. When you write your own tests, watch each one fail before you make it pass (Day 25 explains why).

## Fixing a bug

8. **Reproduce it first.** Write a test that fails *because of the bug*, run it and watch it go red. Then fix the code until it passes, then run all the tests to check you didn't break something else. Day 12 and Day 98 practise this.

## Before you call it done

9. **Run the checks.** All three must be clean for your day:

   ```bash
   npm test -- day-001                    # the day's tests (use your day's number)
   npm run typecheck                      # TypeScript in strict mode
   npx eslint phase-1-terminal/day-001-mpesa-sms   # lint just your day's folder
   ```

   `npm run typecheck` checks the whole repo, so it also lists errors in days you haven't done yet: only fix the ones in your day's folder. `npm run lint` lints the whole repo, the way CI does. Don't silence a warning without a comment saying why.

## Saving your work

10. **Commit clean, and say why.** Never commit `.env`, keys, `node_modules/` or files a tool generates: `.gitignore` already covers them, so run `git status` and look before you commit. Add the files you mean by name (`git add phase-1-terminal/day-001-mpesa-sms`) rather than everything at once. A good message says what changed and why: `day 12: fix the loop running once too many`, not `update`.
