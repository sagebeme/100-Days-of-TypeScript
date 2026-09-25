// Already written. Try not to read this until you've written your scenarios!
//
// Four broken versions of the app, each with one realistic bug. The official tests run your scenarios
// against each one. If none of your scenarios fails against a mutant, your tests missed that bug.
import { can, type Action, type Actor } from "./policy.ts";
import type { AppOptions } from "./app.ts";

export interface Mutant {
  name: string;
  options: Partial<AppOptions>;
}

export const MUTANTS: Mutant[] = [
  {
    name: "organisers can edit ANY event, not just their own",
    options: {
      policy: (actor: Actor | null, action: Action) =>
        action.do === "edit-event" && actor?.role === "organiser" && action.event.status !== "cancelled" ? true : can(actor, action),
    },
  },
  {
    name: "drafts are visible to everyone",
    options: {
      policy: (actor: Actor | null, action: Action) => (action.do === "see-event" ? true : can(actor, action)),
    },
  },
  {
    name: "fans can create events",
    options: { creatorRoles: ["fan", "organiser", "admin"] },
  },
  {
    name: "the last admin can demote themselves",
    options: { protectLastAdmin: false },
  },
];
