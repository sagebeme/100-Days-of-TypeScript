// A binary min-heap: always hands back the smallest item first, in O(log n). Dijkstra needs one.
export class MinHeap<T> {
  readonly #items: T[] = [];
  readonly #less: (a: T, b: T) => boolean;

  constructor(less: (a: T, b: T) => boolean) {
    this.#less = less;
  }

  get size(): number {
    return this.#items.length;
  }

  push(item: T): void {
    const items = this.#items;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.#less(items[i], items[parent])) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop(): T | undefined {
    const items = this.#items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && this.#less(items[left], items[smallest])) smallest = left;
        if (right < items.length && this.#less(items[right], items[smallest])) smallest = right;
        if (smallest === i) break;
        [items[i], items[smallest]] = [items[smallest], items[i]];
        i = smallest;
      }
    }
    return top;
  }
}
