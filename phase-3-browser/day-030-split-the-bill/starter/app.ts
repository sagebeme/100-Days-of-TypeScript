import { getElement } from "./dom.ts";
import { splitBill, formatKes } from "./split.ts";

export function mountSplitter(root: ParentNode): void {
  // TODO: find #bill (HTMLFormElement), #total and #people (HTMLInputElement),
  //       #tip (HTMLSelectElement) and #result (HTMLParagraphElement) with getElement

  // TODO: an update() function:
  //   - empty total or people -> "Enter the total and how many people"
  //   - otherwise "Each person pays KES 880 (tip KES 480)"
  //   - if splitBill throws, show the error's message instead

  // TODO: run update() on the form's "input" event, and once now
  // TODO: stop the form's "submit" event from reloading the page
  throw new Error("not implemented yet");
}
