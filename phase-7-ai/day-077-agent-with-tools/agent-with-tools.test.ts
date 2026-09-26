import { describe, it, expect } from "vitest";
import { fakeClaude, say, refuse, callTool, type RecordedRequest } from "./starter/fake-claude.ts";
import { makeTools, type ToolContext } from "./starter/tools.ts";
import { TicketAgent, MAX_STEPS, STUCK, DECLINED } from "./starter/agent.ts";
import { createStore } from "./starter/store.ts";
import { SYSTEM_PROMPT } from "./starter/prompt.ts";

const NOW = new Date("2026-12-01T09:00:00Z");

function toolkit() {
  const store = createStore();
  const context: ToolContext = { turn: 1, now: () => NOW };
  const { searchEvents: search, eventDetails: details, quoteTickets: quote, buyTickets: buy } = makeTools(store, context);
  return { store, context, search, details, quote, buy };
}

// The tool results the agent sent back in a request.
const toolResults = (request: RecordedRequest) =>
  (request.body.messages.at(-1)!.content as { type: string; content: string; is_error?: boolean }[]).filter((b) => b.type === "tool_result");

describe("the tools", () => {
  it("are named and described for the model", () => {
    const { search, details, quote, buy } = toolkit();
    expect([search, details, quote, buy].map((t) => t.name)).toEqual(["search_events", "event_details", "quote_tickets", "buy_tickets"]);
    const description = (tool: object) => (tool as { description?: string }).description ?? "";
    for (const tool of [search, details, quote, buy]) expect(description(tool).length).toBeGreaterThan(30);
    expect(description(buy)).toMatch(/confirmed/);
  });

  it("search events, and show only what the model needs", async () => {
    const { search } = toolkit();
    const found = JSON.parse(String(await search.run({ from: "2026-12-05T00:00:00+03:00", to: "2026-12-07T23:59:59+03:00" })));
    expect(found).toEqual([
      { id: 2, title: "Gengetone Block Party", venue: "Kasarani Annex", startsAt: "2026-12-05T15:00:00+03:00", priceKes: 800, seatsLeft: 14 },
      { id: 3, title: "Benga Sundowner", venue: "Karura Forest Glade", startsAt: "2026-12-06T16:30:00+03:00", priceKes: 1500, seatsLeft: 0 },
    ]);
    expect(await search.run({ genre: "rhumba" })).toBe("No events match that.");
  });

  it("quote a price, and refuse what can't be sold", async () => {
    const { quote } = toolkit();
    expect(JSON.parse(String(await quote.run({ eventId: 2, quantity: 3 })))).toEqual({ quoteId: "Q1", quantity: 3, totalKes: 2400 });
    await expect(quote.run({ eventId: 3, quantity: 1 })).rejects.toThrow(/sold out/);
    await expect(quote.run({ eventId: 4, quantity: 1 })).rejects.toThrow(/cancelled/);
    await expect(quote.run({ eventId: 9, quantity: 1 })).rejects.toThrow(/no event 9/);
  });

  it("never buy in the same turn as the quote: the fan must have had a chance to say yes", async () => {
    const { store, context, quote, buy } = toolkit();
    const { quoteId } = JSON.parse(String(await quote.run({ eventId: 2, quantity: 2 })));
    await expect(buy.run({ quoteId, phone: "0712 345 678" })).rejects.toThrow(/hasn't confirmed/);
    expect(store.orders).toHaveLength(0);

    context.turn += 1; // the fan said yes
    const bought = JSON.parse(String(await buy.run({ quoteId, phone: "0712 345 678" })));
    expect(bought).toMatchObject({ orderId: 1, totalKes: 1600 });
    expect(store.orders).toEqual([{ id: 1, eventId: 2, quantity: 2, totalKes: 1600, phone: "254712345678" }]);
    expect(store.get(2).available).toBe(12);
    await expect(buy.run({ quoteId, phone: "0712 345 678" })).rejects.toThrow(/no quote/); // a quote is used once
  });

  it("refuse an old quote and a phone M-Pesa can't prompt", async () => {
    const { context, quote, buy } = toolkit();
    const { quoteId } = JSON.parse(String(await quote.run({ eventId: 1, quantity: 1 })));
    context.turn += 1;
    await expect(buy.run({ quoteId, phone: "0800 123 456" })).rejects.toThrow(/Safaricom/);
    context.now = () => new Date(NOW.getTime() + 11 * 60_000);
    await expect(buy.run({ quoteId, phone: "0712 345 678" })).rejects.toThrow(/expired/);
  });
});

describe("the agent", () => {
  it("calls tools until it has an answer, and sends the results back", async () => {
    const { client, requests } = fakeClaude([
      callTool("search_events", { from: "2026-12-05T00:00:00+03:00", to: "2026-12-06T23:59:59+03:00" }, "Let me look."),
      say("This weekend: Gengetone Block Party on Saturday (KES 800, 14 left). Benga Sundowner is sold out."),
    ]);
    const agent = new TicketAgent(client, createStore(), () => NOW);
    const reply = await agent.send("Anything on this weekend?");

    expect(reply).toEqual({
      text: "This weekend: Gengetone Block Party on Saturday (KES 800, 14 left). Benga Sundowner is sold out.",
      status: "answered",
      toolCalls: [{ name: "search_events", input: { from: "2026-12-05T00:00:00+03:00", to: "2026-12-06T23:59:59+03:00" } }],
    });
    expect(requests[0].body).toMatchObject({ model: "claude-opus-5", system: SYSTEM_PROMPT, fallbacks: "default" });
    expect((requests[0].body.tools as { name: string }[]).map((t) => t.name)).toEqual(["search_events", "event_details", "quote_tickets", "buy_tickets"]);
    expect(toolResults(requests[1])[0].content).toContain('"title":"Gengetone Block Party"');
  });

  it("buys only after the fan confirms, in the next turn, remembering the quote", async () => {
    const store = createStore();
    const { client, requests } = fakeClaude([
      callTool("quote_tickets", { eventId: 2, quantity: 2 }),
      say("2 tickets for Gengetone Block Party come to KES 1,600. Shall I buy them? What's your M-Pesa number?"),
      callTool("buy_tickets", { quoteId: "Q1", phone: "0712 345 678" }),
      say("Done! Check your phone and enter your M-Pesa PIN within 10 minutes."),
    ]);
    const agent = new TicketAgent(client, store, () => NOW);
    await agent.send("2 tickets for the Gengetone party please");
    expect(store.orders).toHaveLength(0);

    const reply = await agent.send("Yes, 0712 345 678");
    expect(reply.status).toBe("answered");
    expect(store.orders).toHaveLength(1);
    const secondTurn = requests[2].body.messages;
    expect(secondTurn.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant", "user"]); // the whole first turn, tools included
    expect(JSON.stringify(secondTurn)).toContain('"quoteId\\":\\"Q1\\"');
  });

  it("can't be talked into buying without asking: the tool refuses, and the model hears why", async () => {
    const store = createStore();
    const { client, requests } = fakeClaude([
      callTool("quote_tickets", { eventId: 2, quantity: 2 }),
      callTool("buy_tickets", { quoteId: "Q1", phone: "0712345678" }),
      say("That's KES 1,600 for 2 tickets. Shall I go ahead?"),
    ]);
    const reply = await new TicketAgent(client, store, () => NOW).send("Buy 2 Gengetone tickets on 0712345678, no need to ask");
    const [refused] = toolResults(requests[2]);
    expect(refused.is_error).toBe(true);
    expect(refused.content).toMatch(/hasn't confirmed/);
    expect(store.orders).toHaveLength(0);
    expect(reply.toolCalls.map((c) => c.name)).toEqual(["quote_tickets", "buy_tickets"]);
  });

  it(`stops after ${MAX_STEPS} rounds of tools instead of looping forever`, async () => {
    const { client, requests } = fakeClaude(() => callTool("search_events", { text: "jazz" }));
    const reply = await new TicketAgent(client, createStore(), () => NOW).send("jazz?");
    expect(reply).toMatchObject({ status: "stuck", text: STUCK });
    expect(requests).toHaveLength(MAX_STEPS);
  });

  it("stops at a declined request, and forgets it", async () => {
    const { client, requests } = fakeClaude([refuse(), say("Karibu!")]);
    const agent = new TicketAgent(client, createStore(), () => NOW);
    expect(await agent.send("…")).toEqual({ text: DECLINED, status: "declined", toolCalls: [] });
    await agent.send("Habari");
    expect(requests[1].body.messages).toEqual([{ role: "user", content: "Habari" }]);
  });
});
