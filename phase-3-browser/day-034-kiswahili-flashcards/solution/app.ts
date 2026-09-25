import { getElement } from "./dom.ts";
import { review, dueCards, learnedCount, loadProgress, saveProgress, type Card } from "./deck.ts";

export interface FlashcardOptions {
  cards: Card[];
  storage: Pick<Storage, "getItem" | "setItem">;
  storageKey: string;
  today: string;
}

export function mountFlashcards(root: ParentNode, options: FlashcardOptions): void {
  const prompt = getElement(root, "#prompt", HTMLElement);
  const answer = getElement(root, "#answer", HTMLElement);
  const gradeButtons = getElement(root, "#grade", HTMLElement);
  const stats = getElement(root, "#stats", HTMLElement);
  const reveal = getElement(root, "#reveal", HTMLButtonElement);
  const right = getElement(root, "#right", HTMLButtonElement);
  const wrong = getElement(root, "#wrong", HTMLButtonElement);

  let progress = loadProgress(options.storage, options.storageKey);
  const queue = dueCards(options.cards, progress, options.today);

  function show(): void {
    stats.textContent = `${queue.length} left · ${learnedCount(progress)} learned`;
    answer.hidden = true;
    gradeButtons.hidden = true;

    const card = queue[0];
    if (card === undefined) {
      prompt.textContent = "Umemaliza! Come back tomorrow.";
      reveal.hidden = true;
      return;
    }
    prompt.textContent = card.sw;
    answer.textContent = card.en;
    reveal.hidden = false;
  }

  function grade(correct: boolean): void {
    const card = queue.shift();
    if (card === undefined) return;
    progress = review(progress, card.id, correct, options.today);
    saveProgress(options.storage, options.storageKey, progress);
    if (!correct) {
      queue.push(card);
    }
    show();
  }

  reveal.addEventListener("click", () => {
    answer.hidden = false;
    gradeButtons.hidden = false;
    reveal.hidden = true;
  });
  right.addEventListener("click", () => grade(true));
  wrong.addEventListener("click", () => grade(false));

  show();
}
