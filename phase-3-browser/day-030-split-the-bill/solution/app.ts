import { getElement } from "./dom.ts";
import { splitBill, formatKes } from "./split.ts";

export function mountSplitter(root: ParentNode): void {
  const form = getElement(root, "#bill", HTMLFormElement);
  const total = getElement(root, "#total", HTMLInputElement);
  const people = getElement(root, "#people", HTMLInputElement);
  const tip = getElement(root, "#tip", HTMLSelectElement);
  const result = getElement(root, "#result", HTMLParagraphElement);

  function update(): void {
    if (total.value === "" || people.value === "") {
      result.textContent = "Enter the total and how many people";
      return;
    }
    try {
      const split = splitBill(Number(total.value), Number(people.value), Number(tip.value));
      result.textContent = `Each person pays ${formatKes(split.perPerson)} (tip ${formatKes(split.tip)})`;
    } catch (error) {
      result.textContent = error instanceof Error ? error.message : String(error);
    }
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => event.preventDefault());
  update();
}
