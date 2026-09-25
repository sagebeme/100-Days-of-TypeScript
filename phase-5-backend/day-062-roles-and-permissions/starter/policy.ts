import type { Role } from "./schema.ts";

// Every permission rule in the app lives in this one file. Routes ask "can this user do this?",
// and never check roles themselves, so the rules can't drift apart or be forgotten in one route.
export interface Actor {
  id: number;
  role: Role;
}

export interface EventRef {
  organiserId: number;
  status: "draft" | "published" | "cancelled";
}

export type Action =
  | { do: "create-event" }
  | { do: "edit-event"; event: EventRef }
  | { do: "publish-event"; event: EventRef }
  | { do: "delete-event"; event: EventRef }
  | { do: "see-event"; event: EventRef }
  | { do: "mark-going"; event: EventRef }
  | { do: "manage-users" };

export function can(actor: Actor | null, action: Action): boolean {
  // TODO: one case per action (a switch on action.do, so TypeScript checks you covered them all):
  //   see-event:     published or cancelled -> anyone; a draft -> only its organiser, or an admin
  //   create-event:  organisers and admins
  //   edit-event / publish-event: not if it's cancelled; otherwise the organiser who owns it, or an admin
  //   delete-event:  only drafts; the organiser who owns it, or an admin
  //   mark-going:    anyone logged in, for a published event
  //   manage-users:  admins
  throw new Error("not implemented yet");
}
