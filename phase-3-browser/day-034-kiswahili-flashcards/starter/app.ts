import { getElement } from "./dom.ts";
import { review, dueCards, learnedCount, loadProgress, saveProgress, type Card } from "./deck.ts";

export interface FlashcardOptions {
  cards: Card[];
  storage: Pick<Storage, "getItem" | "setItem">;
  storageKey: string;
  today: string;
}

export function mountFlashcards(root: ParentNode, options: FlashcardOptions): void {
  // TODO: find #prompt, #answer, #grade, #stats (HTMLElement) and #reveal, #right, #wrong (HTMLButtonElement)
  // TODO: let progress = loadProgress(...); const queue = dueCards(...)

  // TODO: show(): the first card in the queue, answer hidden, #reveal shown, #grade hidden,
  //       or "Umemaliza! Come back tomorrow." with everything else hidden when the queue is empty.
  //       Always update #stats: "3 left · 5 learned"

  // TODO: #reveal -> show the answer and #grade, hide #reveal
  // TODO: grade(correct): review + saveProgress, take the card off the front,
  //       put it on the back if it was wrong, then show()
  // TODO: show() once now
  throw new Error("not implemented yet");
}
