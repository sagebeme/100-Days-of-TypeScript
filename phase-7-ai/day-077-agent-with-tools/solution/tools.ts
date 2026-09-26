import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Store, StoreEvent } from "./store.ts";

// What the tools need to know about the conversation they're in.
export interface ToolContext {
  turn: number; // goes up by one every time the fan says something
  now: () => Date;
}

// Only what the model needs: every extra field is tokens, and something else to get confused by.
function summary(event: StoreEvent) {
  return { id: event.id, title: event.title, venue: event.venue, startsAt: event.startsAt, priceKes: event.priceKes, seatsLeft: event.available };
}

// The tools. A tool's description is the model's only guide to when and how to use it, so it says
// both. A tool that throws sends the model an error result instead, and the model can recover
// ("there's no event 9, let me search again").
export function makeTools(store: Store, context: ToolContext) {
  const searchEvents = betaZodTool({
    name: "search_events",
    description: "Find events on sale, soonest first. All filters are optional; use them to narrow a search. Returns up to 10.",
    inputSchema: z.object({
      text: z.string().optional().describe("Words from the title, venue or genre"),
      genre: z.enum(["afrobeats", "benga", "gengetone", "jazz", "comedy", "rhumba"]).optional(),
      from: z.iso.datetime({ offset: true }).optional().describe("Earliest start, like 2026-12-05T00:00:00+03:00"),
      to: z.iso.datetime({ offset: true }).optional().describe("Latest start"),
    }),
    run: async (filters) => {
      const events = store.search(filters).slice(0, 10);
      return events.length === 0 ? "No events match that." : JSON.stringify(events.map(summary));
    },
  });

  const eventDetails = betaZodTool({
    name: "event_details",
    description: "The details of one event, including how many seats are left right now.",
    inputSchema: z.object({ eventId: z.number().int() }),
    run: async ({ eventId }) => {
      const event = store.get(eventId);
      return JSON.stringify({ ...summary(event), status: event.status });
    },
  });

  const quoteTickets = betaZodTool({
    name: "quote_tickets",
    description: "Price a number of tickets for an event, and hold the price for 10 minutes. Show the fan the total and ask them to confirm before buying.",
    inputSchema: z.object({ eventId: z.number().int(), quantity: z.number().int().min(1).max(10) }),
    run: async ({ eventId, quantity }) => {
      const quote = store.quote(eventId, quantity, context.turn, context.now());
      return JSON.stringify({ quoteId: quote.id, quantity: quote.quantity, totalKes: quote.totalKes });
    },
  });

  // The one tool that spends money. The prompt asks the model to get a yes first; this makes sure.
  // A quote made in this same turn means the fan hasn't had a chance to say yes, so it's refused,
  // whatever the model thinks. Rules that matter go in code, not only in the prompt.
  const buyTickets = betaZodTool({
    name: "buy_tickets",
    description: "Buy the tickets in a quote the fan has confirmed, and send an M-Pesa payment prompt to their phone.",
    inputSchema: z.object({ quoteId: z.string(), phone: z.string().describe("The M-Pesa number to pay with, as the fan gave it") }),
    run: async ({ quoteId, phone }) => {
      const quote = store.findQuote(quoteId);
      if (!quote) throw new Error(`There's no quote ${quoteId}. Make a new one.`);
      if (quote.expiresAt < context.now().getTime()) throw new Error("That quote has expired. Make a new one and check with the fan again.");
      if (quote.turn >= context.turn) throw new Error("The fan hasn't confirmed this quote yet. Tell them the total and ask them to confirm first.");
      const order = store.buy(quote, phone);
      return JSON.stringify({ orderId: order.id, totalKes: order.totalKes, next: "An M-Pesa prompt was sent. They have 10 minutes to enter their PIN." });
    },
  });

  return { searchEvents, eventDetails, quoteTickets, buyTickets };
}
