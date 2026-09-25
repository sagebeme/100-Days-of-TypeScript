import { mountFlashcards } from "./app.ts";
import { CARDS } from "./cards.ts";

mountFlashcards(document, {
  cards: CARDS,
  storage: localStorage,
  storageKey: "kiswahili-flashcards",
  today: new Date().toISOString().slice(0, 10),
});
