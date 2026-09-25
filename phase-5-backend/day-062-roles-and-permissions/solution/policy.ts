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
  const isAdmin = actor?.role === "admin";
  const owns = (event: EventRef) => actor !== null && event.organiserId === actor.id;

  switch (action.do) {
    case "see-event":
      // Everyone can see published and cancelled events. Drafts are only for their organiser (and admins).
      return action.event.status !== "draft" || owns(action.event) || isAdmin;
    case "create-event":
      return actor?.role === "organiser" || isAdmin;
    case "edit-event":
    case "publish-event":
      // Organisers can only touch their own events, and nobody edits a cancelled one.
      return action.event.status !== "cancelled" && ((actor?.role === "organiser" && owns(action.event)) || isAdmin);
    case "delete-event":
      // An event people may have planned around is cancelled, not deleted: only drafts can be deleted.
      return action.event.status === "draft" && ((actor?.role === "organiser" && owns(action.event)) || isAdmin);
    case "mark-going":
      return actor !== null && action.event.status === "published";
    case "manage-users":
      return isAdmin;
  }
}
