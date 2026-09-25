import { getElement } from "./dom.ts";
import { parseSignup, TICKET_LABELS, type Signup } from "./signup.ts";

function guestText(guests: number): string {
  if (guests === 0) return "no guests";
  return guests === 1 ? "1 guest" : `${guests} guests`;
}

export function mountSignup(root: ParentNode, onSignup: (signup: Signup) => void): void {
  const form = getElement(root, "#signup", HTMLFormElement);
  const status = getElement(root, "#status", HTMLElement);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    for (const slot of form.querySelectorAll("[data-error-for]")) {
      slot.textContent = "";
    }
    for (const field of form.querySelectorAll("[aria-invalid]")) {
      field.removeAttribute("aria-invalid");
    }

    const result = parseSignup(new FormData(form));

    if (!result.ok) {
      status.textContent = "";
      let firstInvalid: HTMLElement | undefined;
      for (const [field, message] of Object.entries(result.errors)) {
        const slot = form.querySelector(`[data-error-for="${field}"]`);
        if (slot) slot.textContent = message;
        for (const input of form.querySelectorAll(`[name="${field}"]`)) {
          input.setAttribute("aria-invalid", "true");
          if (!firstInvalid && input instanceof HTMLElement) firstInvalid = input;
        }
      }
      firstInvalid?.focus();
      return;
    }

    const signup = result.value;
    onSignup(signup);
    form.reset();
    status.textContent = `You're in, ${signup.name}! ${TICKET_LABELS[signup.ticket]} ticket, ${guestText(signup.guests)}.`;
  });
}
