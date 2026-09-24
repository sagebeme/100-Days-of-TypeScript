import { describe, it, expect } from "vitest";
import { Book, ReferenceBook, Library } from "./starter/library.ts";

describe("Book", () => {
  it("starts available with a title and author", () => {
    const book = new Book("Kitchen Table Stories", "W. Otieno");
    expect(book.title).toBe("Kitchen Table Stories");
    expect(book.author).toBe("W. Otieno");
    expect(book.isAvailable).toBe(true);
    expect(book.borrower).toBeNull();
  });

  it("records who checked it out", () => {
    const book = new Book("Kitchen Table Stories", "W. Otieno");
    book.checkOut("Amina");
    expect(book.isAvailable).toBe(false);
    expect(book.borrower).toBe("Amina");
  });

  it("cannot be checked out twice", () => {
    const book = new Book("Kitchen Table Stories", "W. Otieno");
    book.checkOut("Amina");
    expect(() => book.checkOut("Kip")).toThrow("Kitchen Table Stories is already checked out");
    expect(book.borrower).toBe("Amina");
  });

  it("becomes available again when given back", () => {
    const book = new Book("Kitchen Table Stories", "W. Otieno");
    book.checkOut("Amina");
    book.giveBack();
    expect(book.isAvailable).toBe(true);
    expect(book.borrower).toBeNull();
  });
});

describe("ReferenceBook", () => {
  it("is a Book, but is never available", () => {
    const atlas = new ReferenceBook("Oxford Atlas", "Various");
    expect(atlas).toBeInstanceOf(Book);
    expect(atlas.isAvailable).toBe(false);
  });

  it("cannot be checked out", () => {
    const atlas = new ReferenceBook("Oxford Atlas", "Various");
    expect(() => atlas.checkOut("Kip")).toThrow("Oxford Atlas is reference only");
    expect(atlas.borrower).toBeNull();
  });
});

describe("Library", () => {
  const stocked = () => {
    const library = new Library();
    library.add(new Book("Kitchen Table Stories", "W. Otieno"));
    library.add(new Book("Nairobi Nights", "J. Mwangi"));
    library.add(new ReferenceBook("Oxford Atlas", "Various"));
    return library;
  };

  it("lists lendable titles only", () => {
    expect(stocked().availableTitles()).toEqual(["Kitchen Table Stories", "Nairobi Nights"]);
  });

  it("removes a title from the available list once it is checked out", () => {
    const library = stocked();
    library.checkOut("Nairobi Nights", "Amina");
    expect(library.availableTitles()).toEqual(["Kitchen Table Stories"]);
  });

  it("throws for a title it does not have", () => {
    expect(() => stocked().checkOut("Missing Book", "Amina")).toThrow("No such book: Missing Book");
  });

  it("refuses to lend a reference book", () => {
    expect(() => stocked().checkOut("Oxford Atlas", "Kip")).toThrow("Oxford Atlas is reference only");
  });

  it("tells reference books from lending books", () => {
    const library = new Library();
    expect(library.kindOf(new ReferenceBook("Oxford Atlas", "Various"))).toBe("reference");
    expect(library.kindOf(new Book("Nairobi Nights", "J. Mwangi"))).toBe("lending");
  });
});
