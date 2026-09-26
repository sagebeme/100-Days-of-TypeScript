// A binary min-heap: hands back the smallest item first. Dijkstra needs one. The tests are the spec.
export class MinHeap<T> {
  readonly #less: (a: T, b: T) => boolean;

  constructor(less: (a: T, b: T) => boolean) {
    this.#less = less;
  }

  get size(): number {
    throw new Error("TODO: size");
  }

  push(item: T): void {
    throw new Error(`TODO: push(${String(item)}, ${typeof this.#less})`);
  }

  pop(): T | undefined {
    throw new Error("TODO: pop");
  }
}
