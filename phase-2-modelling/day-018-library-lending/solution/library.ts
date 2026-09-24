export class Book {
  readonly title: string;
  readonly author: string;
  #borrower: string | null = null;

  constructor(title: string, author: string) {
    this.title = title;
    this.author = author;
  }

  get isAvailable(): boolean {
    return this.#borrower === null;
  }

  get borrower(): string | null {
    return this.#borrower;
  }

  checkOut(person: string): void {
    if (!this.isAvailable) {
      throw new Error(`${this.title} is already checked out`);
    }
    this.#borrower = person;
  }

  giveBack(): void {
    this.#borrower = null;
  }
}

export class ReferenceBook extends Book {
  override get isAvailable(): boolean {
    return false;
  }

  override checkOut(person: string): void {
    throw new Error(`${this.title} is reference only`);
  }
}

export class Library {
  #books: Book[] = [];

  add(book: Book): void {
    this.#books.push(book);
  }

  checkOut(title: string, person: string): void {
    const book = this.#books.find((b) => b.title === title);
    if (book === undefined) {
      throw new Error(`No such book: ${title}`);
    }
    book.checkOut(person);
  }

  availableTitles(): string[] {
    return this.#books.filter((b) => b.isAvailable).map((b) => b.title);
  }

  kindOf(book: Book): "reference" | "lending" {
    return book instanceof ReferenceBook ? "reference" : "lending";
  }
}
