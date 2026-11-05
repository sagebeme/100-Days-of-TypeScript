# Day 18: Library Lending — Composition and Inheritance

Watch the video: *(not recorded yet)*

## The brief

A neighbourhood library lets people borrow books. Most books can be checked out. Some are **reference books** (dictionaries, atlases) that never leave the building. You'll model this two ways at once:

- **Composition**: a `Library` *has* a shelf of `Book`s and manages them
- **Inheritance**: a `ReferenceBook` *is* a `Book`, with different rules

```
const library = new Library();
library.add(new Book("Kitchen Table Stories", "W. Otieno"));
library.add(new ReferenceBook("Oxford Atlas", "Various"));

library.checkOut("Kitchen Table Stories", "Amina");
library.availableTitles()                    →  []
library.checkOut("Oxford Atlas", "Kip")      →  throws "Oxford Atlas is reference only"
```

## What you'll use

- `class Book` with a private `#borrower` and getters for state
- `class ReferenceBook extends Book`, and the `override` keyword to replace a parent's behaviour (the compiler requires it)
- `class Library` holding an array of books (composition)
- `instanceof` to ask "is this object a `ReferenceBook`?"

## Steps

1. Open `starter/library.ts`. Read all three classes and their `TODO`s.
2. **`Book`**: set `title` and `author` in the constructor. `isAvailable` is true when `#borrower` is `null`. `borrower` returns `#borrower`. `checkOut(person)` throws `"<title> is already checked out"` if it isn't available, otherwise records the borrower. `giveBack()` clears it.
3. **`ReferenceBook`**: `override` the `isAvailable` getter to always return `false`, and `override` `checkOut` to always throw `"<title> is reference only"`.
4. **`Library`**: `add(book)` pushes onto its private `#books`. `checkOut(title, person)` finds the book by title (throw `"No such book: <title>"` if missing) and calls the book's own `checkOut`. `availableTitles()` returns the titles of books that are available. `kindOf(book)` returns `"reference"` for a `ReferenceBook` (use `instanceof`) and `"lending"` for anything else.
5. Run the tests:

   ```bash
   npm test -- day-018
   ```

## Check yourself

1. Which relationship is composition and which is inheritance in today's code?
2. What does `tsc` say if you leave out `override` on `ReferenceBook`'s `checkOut`, and why does this repo ask for it?
3. `Library.checkOut` only knows it holds `Book`s. Why does checking out the atlas still throw `"Oxford Atlas is reference only"`?
4. Predict the output: `new ReferenceBook("Oxford Atlas", "Various") instanceof Book` and `library.kindOf(new Book("Kitchen Table Stories", "W. Otieno"))`

<details><summary>Answers</summary>

1. A `Library` *has* books (composition: it keeps them in `#books`). A `ReferenceBook` *is* a book (inheritance: `extends Book`).
2. "This member must have an 'override' modifier because it overrides a member in the base class 'Book'." `noImplicitOverride` is on in `tsconfig.json`, so replacing a parent's method is always on purpose, and renaming the parent's method can't silently leave an orphan behind.
3. Which method runs is decided by the object, not by the variable's type. The object is a `ReferenceBook`, so its own `checkOut` runs.
4. `true` (a reference book is still a book) and `"lending"`.

</details>

## When you're stuck

- **"This member must have an 'override' modifier"** — when a subclass replaces something from its parent, TypeScript wants you to say so: `override checkOut(...)`. It catches typos in the name.
- **`ReferenceBook` can't read `#borrower`** — that's the point of `#`: it's private to `Book` itself, not its subclasses. Go through the getters and methods.
- **`kindOf` returns `"lending"` for a reference book** — check the order of your `instanceof` test. A `ReferenceBook` is *also* a `Book`, so `book instanceof Book` is true for both.
- **Inheritance or composition?** A rough rule: use inheritance for a true "is a" (a reference book *is* a book) and composition for "has a" (a library *has* books). When unsure, start with composition.
- **Still stuck?** Read `solution/library.ts`, then close it and write your own from memory.
