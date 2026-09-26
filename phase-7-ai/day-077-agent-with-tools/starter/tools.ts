import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Store, StoreEvent } from "./store.ts";

// What the tools need to know about the conversation they're in.
export interface ToolContext {
  turn: number; // goes up by one every time the fan says something
  now: () => Date;
}

// Already written: only what the model needs. Every extra field is tokens, and something else to get confused by.
export function summary(event: StoreEvent) {
  return { id: event.id, title: event.title, venue: event.venue, startsAt: event.startsAt, priceKes: event.priceKes, seatsLeft: event.available };
}

// TODO: four tools. Their names and inputs are written; write each one's description and run().
// The description is the model's only guide to when and how to use a tool, so say both (a sentence
// or two). A run() that throws sends the model an error result, and the model can recover.
//
// search_events: up to 10 of store.search(filters), as JSON of summary(), or "No events match that."
// event_details: JSON of summary() plus the event's status
// quote_tickets: store.quote(eventId, quantity, context.turn, context.now()), as JSON
//   { quoteId, quantity, totalKes }. The description tells the model to confirm the total with the fan.
// buy_tickets: spends money, so check first, and throw a message the model can act on:
//   no such quote:                     "There's no quote Q7. Make a new one."
//   expired (expiresAt before now):    "That quote has expired. Make a new one and check with the fan again."
//   made THIS turn (quote.turn >= context.turn): "The fan hasn't confirmed this quote yet. Tell them the total and ask them to confirm first."
//   then store.buy(quote, phone), as JSON { orderId, totalKes, next: "An M-Pesa prompt was sent. They have 10 minutes to enter their PIN." }
//   The prompt asks the model to get a yes first; the turn check makes sure. Rules that matter go in code.
export function makeTools(store: Store, context: ToolContext) {
  const todo = (name: string) => async (): Promise<string> => {
    void [store, context];
    throw new Error(`TODO: ${name}`);
  };

  const searchEvents = betaZodTool({
    name: "search_events",
    description: "TODO",
    inputSchema: z.object({
      text: z.string().optional().describe("Words from the title, venue or genre"),
      genre: z.enum(["afrobeats", "benga", "gengetone", "jazz", "comedy", "rhumba"]).optional(),
      from: z.iso.datetime({ offset: true }).optional().describe("Earliest start, like 2026-12-05T00:00:00+03:00"),
      to: z.iso.datetime({ offset: true }).optional().describe("Latest start"),
    }),
    run: todo("search_events"),
  });

  const eventDetails = betaZodTool({
    name: "event_details",
    description: "TODO",
    inputSchema: z.object({ eventId: z.number().int() }),
    run: todo("event_details"),
  });

  const quoteTickets = betaZodTool({
    name: "quote_tickets",
    description: "TODO",
    inputSchema: z.object({ eventId: z.number().int(), quantity: z.number().int().min(1).max(10) }),
    run: todo("quote_tickets"),
  });

  const buyTickets = betaZodTool({
    name: "buy_tickets",
    description: "TODO",
    inputSchema: z.object({ quoteId: z.string(), phone: z.string().describe("The M-Pesa number to pay with, as the fan gave it") }),
    run: todo("buy_tickets"),
  });

  return { searchEvents, eventDetails, quoteTickets, buyTickets };
}
