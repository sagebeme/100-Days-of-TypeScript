import { getElement } from "./dom.ts";
import { parseSignup, TICKET_LABELS, type Signup } from "./signup.ts";

export function mountSignup(root: ParentNode, onSignup: (signup: Signup) => void): void {
  // TODO: find #signup (HTMLFormElement) and #status (HTMLElement)

  // TODO: on submit:
  //   - preventDefault
  //   - clear every [data-error-for] slot and remove aria-invalid from every field
  //   - parseSignup(new FormData(form))
  //   - errors: fill each slot, set aria-invalid="true" on each [name="<field>"], focus the first one
  //   - success: onSignup(value), form.reset(), and #status = "You're in, Amina! VIP ticket, 2 guests."
  //     ("1 guest" for one, "no guests" for zero)
  throw new Error("not implemented yet");
}
