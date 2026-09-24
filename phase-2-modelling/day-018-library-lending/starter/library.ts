export class Book {
  readonly title: string;
  readonly author: string;
  #borrower: string | null = null;

  constructor(title: string, author: string) {
    // TODO: assign this.title and this.author
    throw new Error("not implemented yet");
  }

  get isAvailable(): boolean {
    // TODO: true when nobody has it checked out
    throw new Error("not implemented yet");
  }

  get borrower(): string | null {
    // TODO: return who has it, or null
    throw new Error("not implemented yet");
  }

  checkOut(person: string): void {
    // TODO: if it isn't available, throw new Error(`${this.title} is already checked out`)
    // TODO: otherwise remember the person as the borrower
    throw new Error("not implemented yet");
  }

  giveBack(): void {
    // TODO: clear the borrower
    throw new Error("not implemented yet");
  }
}

export class ReferenceBook extends Book {
  // TODO: override the isAvailable getter so it always returns false
  // TODO: override checkOut so it always throws new Error(`${this.title} is reference only`)
}

export class Library {
  #books: Book[] = [];

  add(book: Book): void {
    // TODO: push the book onto #books
    throw new Error("not implemented yet");
  }

  checkOut(title: string, person: string): void {
    // TODO: find the book by title; throw new Error(`No such book: ${title}`) if it's missing
    // TODO: then call the book's own checkOut(person)
    throw new Error("not implemented yet");
  }

  availableTitles(): string[] {
    // TODO: return the titles of every book that isAvailable
    throw new Error("not implemented yet");
  }

  kindOf(book: Book): "reference" | "lending" {
    // TODO: "reference" if book is a ReferenceBook (instanceof), otherwise "lending"
    throw new Error("not implemented yet");
  }
}
