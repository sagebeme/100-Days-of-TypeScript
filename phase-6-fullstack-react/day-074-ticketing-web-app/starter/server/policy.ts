import type { Role } from "./schema.ts";

// Every permission rule in the app, in one place (Day 62). Routes ask; they never check roles themselves.
export interface Actor {
  id: number;
  role: Role;
}

export interface EventRef {
  organiserId: number;
  status: "draft" | "published" | "cancelled";
  startsAt: string;
}

export interface OrderRef {
  userId: number;
}

export type Action =
  | { do: "create-event" }
  | { do: "edit-event"; event: EventRef }
  | { do: "see-event"; event: EventRef }
  | { do: "buy-tickets"; event: EventRef; now: Date }
  | { do: "see-order"; order: OrderRef }
  | { do: "check-in"; event: EventRef }
  | { do: "see-sales"; event: EventRef };

export function can(actor: Actor | null, action: Action): boolean {
  const isAdmin = actor?.role === "admin";
  const runs = (event: EventRef) => actor !== null && ((actor.role === "organiser" && event.organiserId === actor.id) || isAdmin);

  switch (action.do) {
    case "see-event":
      return action.event.status !== "draft" || runs(action.event);
    case "create-event":
      return actor?.role === "organiser" || isAdmin;
    case "edit-event":
      return action.event.status !== "cancelled" && runs(action.event);
    case "buy-tickets":
      // Anyone logged in, for a published event that hasn't started yet.
      return actor !== null && action.event.status === "published" && new Date(action.event.startsAt) > action.now;
    case "see-order":
      // Your own orders. Admins can see any, to help someone whose payment went wrong.
      return actor !== null && (action.order.userId === actor.id || isAdmin);
    case "check-in":
      // The people running the event scan tickets at the gate. Nobody gets into a cancelled event.
      return action.event.status === "published" && runs(action.event);
    case "see-sales":
      return runs(action.event);
  }
}
