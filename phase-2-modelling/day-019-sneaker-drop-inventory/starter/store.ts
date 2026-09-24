export type Sneaker = {
  id: string;
  model: string;
  sizeUs: number;
  stock: number;
};

export class Store<T extends { id: string }> {
  #items: T[] = [];

  add(item: T): void {
    // TODO: throw new Error(`Duplicate id: ${item.id}`) if an item with that id is already stored
    // TODO: otherwise push the item
    throw new Error("not implemented yet");
  }

  get(id: string): T | undefined {
    // TODO: return the item with that id, or undefined
    throw new Error("not implemented yet");
  }

  remove(id: string): boolean {
    // TODO: remove the item with that id; return true if one was removed, false if not
    throw new Error("not implemented yet");
  }

  all(): T[] {
    // TODO: return a COPY of the items, not the private array itself
    throw new Error("not implemented yet");
  }

  get size(): number {
    // TODO: how many items are stored
    throw new Error("not implemented yet");
  }
}

export function totalStock(store: Store<Sneaker>): number {
  // TODO: add up the stock of every sneaker in the store
  throw new Error("not implemented yet");
}
