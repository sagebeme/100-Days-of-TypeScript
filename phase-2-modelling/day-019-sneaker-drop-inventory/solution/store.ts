export type Sneaker = {
  id: string;
  model: string;
  sizeUs: number;
  stock: number;
};

export class Store<T extends { id: string }> {
  #items: T[] = [];

  add(item: T): void {
    if (this.get(item.id) !== undefined) {
      throw new Error(`Duplicate id: ${item.id}`);
    }
    this.#items.push(item);
  }

  get(id: string): T | undefined {
    return this.#items.find((item) => item.id === id);
  }

  remove(id: string): boolean {
    const index = this.#items.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    this.#items.splice(index, 1);
    return true;
  }

  all(): T[] {
    return [...this.#items];
  }

  get size(): number {
    return this.#items.length;
  }
}

export function totalStock(store: Store<Sneaker>): number {
  let total = 0;
  for (const sneaker of store.all()) {
    total += sneaker.stock;
  }
  return total;
}
