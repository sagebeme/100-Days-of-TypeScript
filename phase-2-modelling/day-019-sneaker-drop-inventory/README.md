# Day 19: Sneaker Drop Inventory — Generics

Watch the video: *(not recorded yet)*

## The brief

A sneaker reseller in Nairobi keeps a stockroom. Today it's sneakers, tomorrow it might be caps or hoodies, and you don't want to write a new storage class for each. Write **one** `Store<T>` that can hold any kind of thing, as long as every thing has an `id`.

```
const stock = new Store<Sneaker>();
stock.add({ id: "aj1", model: "Air Jordan 1", sizeUs: 9, stock: 3 });
stock.get("aj1")?.model   →  "Air Jordan 1"
stock.size                →  1
totalStock(stock)         →  3
```

## What you'll use

- **Generics**: `class Store<T>` means "a Store of *some type T*, decided when you create it"
- **Constraints**: `T extends { id: string }` means "T can be anything, as long as it has a string `id`"
- A private array field, and returning a **copy** of it so callers can't reach in and change your data
- Optional chaining, `stock.get("aj1")?.model`, for values that might be `undefined`

## Steps

1. Open `starter/store.ts`. Read `Store<T extends { id: string }>` and the `Sneaker` type.
2. Write `add(item)`. If an item with the same `id` is already stored, throw `new Error("Duplicate id: <id>")`. Otherwise push it.
3. Write `get(id)`. Return the matching item or `undefined`. Note the return type is `T | undefined`.
4. Write `remove(id)`. Remove the matching item and return `true`, or return `false` if there wasn't one.
5. Write `all()`. Return a **copy** of the array (`[...this.#items]`), not the array itself.
6. Write the `size` getter: the number of items.
7. Write `totalStock(store)`: add up the `stock` of every sneaker in a `Store<Sneaker>`.
8. Run the tests:

   ```bash
   npm test -- day-019
   ```

## When you're stuck

- **"Property 'id' does not exist on type 'T'"** — the constraint `T extends { id: string }` is what lets you read `item.id` inside the class. Check that it's on the class line.
- **The "changing the result of all() doesn't change the store" test fails** — you returned the private array itself. Return `[...this.#items]`.
- **`stock.get("x")?.model` — what's the `?.`?** If `get` returns `undefined`, `?.` stops and gives `undefined` instead of crashing.
- **Still stuck?** Read `solution/store.ts`, then close it and write your own from memory.
