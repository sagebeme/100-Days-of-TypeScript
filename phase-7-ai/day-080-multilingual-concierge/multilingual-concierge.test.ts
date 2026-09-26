import { describe, it, expect } from "vitest";
import { fakeClaude, say, refuse, callTool, type RecordedRequest, type Reply } from "./starter/fake-claude.ts";
import { understand } from "./starter/understand.ts";
import { Concierge } from "./starter/concierge.ts";
import { LANGUAGE_GUIDE, PHRASES, REPLY_STYLE } from "./starter/languages.ts";
import { hashingEmbedder } from "../day-078-embeddings-and-retrieval/starter/embedders.ts";
import { chunkAll } from "../day-078-embeddings-and-retrieval/starter/chunks.ts";
import { HELP_CENTRE } from "../day-078-embeddings-and-retrieval/starter/help-centre.ts";
import { buildIndex, search } from "../day-078-embeddings-and-retrieval/starter/retrieval.ts";
import { createStore } from "../day-077-agent-with-tools/starter/store.ts";

const NOW = new Date("2026-12-01T09:00:00Z");
const SHENG_REFUND = "Manze, doh yangu itarudi kama event imecancelliwa?";

type Body = Record<string, any>;
const isUnderstanding = (r: RecordedRequest) => Boolean((r.body as Body).output_config?.format);
const isTickets = (r: RecordedRequest) => Array.isArray((r.body as Body).tools);
const understood = (language: string, route: string, searchQuery: string): Reply => say(JSON.stringify({ language, route, searchQuery }));

describe("understanding a message", () => {
  it("asks for the language, the route and an English search question, in a fixed shape", async () => {
    const { client, requests } = fakeClaude([understood("sheng", "help", "Will I get my money back if the event is cancelled?")]);
    expect(await understand(client, SHENG_REFUND)).toEqual({ language: "sheng", route: "help", searchQuery: "Will I get my money back if the event is cancelled?" });
    const body = requests[0].body as Body;
    expect(body.model).toBe("claude-opus-5");
    expect(body.system).toContain(LANGUAGE_GUIDE);
    expect(Object.keys(body.output_config.format.schema.properties)).toEqual(["language", "route", "searchQuery"]);
    expect(body.messages).toEqual([{ role: "user", content: SHENG_REFUND }]);
  });

  it("treats a reply it can't use as an English help question, and a declined one as off-topic", async () => {
    const { client } = fakeClaude([say(JSON.stringify({ language: "french", route: "help", searchQuery: "x" })), say("sheng!"), refuse()]);
    expect(await understand(client, "bonjour")).toEqual({ language: "english", route: "help", searchQuery: "bonjour" });
    expect(await understand(client, "hmm")).toEqual({ language: "english", route: "help", searchQuery: "hmm" });
    expect((await understand(client, "…")).route).toBe("other");
  });
});

describe("why the English rewrite matters", () => {
  it("the help centre's search can't find a Sheng question, but finds its English rewrite", async () => {
    const index = await buildIndex(hashingEmbedder(), chunkAll(HELP_CENTRE));
    expect((await search(index, SHENG_REFUND)).map((h) => h.chunk.id)).not.toContain("refunds#2");
    expect((await search(index, "Will I get my money back if the event is cancelled?"))[0].chunk.id).toBe("refunds#2");
  });
});

describe("the concierge", () => {
  const make = async (script: (r: RecordedRequest, i: number) => Reply) => {
    const fake = fakeClaude(script);
    const store = createStore();
    return { ...fake, store, concierge: await Concierge.create(fake.client, hashingEmbedder(), store, () => NOW) };
  };

  it("answers a Sheng question from the help centre, in Sheng, with sources", async () => {
    const { concierge, requests } = await make((r) =>
      isUnderstanding(r)
        ? understood("sheng", "help", "Will I get my money back if the event is cancelled?")
        : say("Sawa manze, kama event imecancelliwa doh yako inarudi kwa M-Pesa ndani ya 3 working days [refunds#2]."),
    );
    const reply = await concierge.send(SHENG_REFUND);
    expect(reply).toEqual({
      text: "Sawa manze, kama event imecancelliwa doh yako inarudi kwa M-Pesa ndani ya 3 working days [refunds#2].",
      language: "sheng",
      route: "help",
      sources: ["refunds#2"],
      toolCalls: [],
    });
    const answer = requests[1].body as Body;
    expect(answer.system).toContain(REPLY_STYLE.sheng);
    const prompt = answer.messages[0].content as string;
    expect(prompt).toContain('<extract id="refunds#2"');
    expect(prompt.endsWith(`Question: ${SHENG_REFUND}`)).toBe(true); // it answers what they asked, as they asked it
  });

  it("says it doesn't know, in their language, without asking a model to answer", async () => {
    const { concierge, requests } = await make(() => understood("sheng", "help", "What is the capital of Tanzania?"));
    expect((await concierge.send("Capital ya Tanzania ni gani?")).text).toBe(PHRASES.noAnswer.sheng);
    expect(requests).toHaveLength(1);
  });

  it("keeps to its job, politely, in their language", async () => {
    const { concierge, requests } = await make(() => understood("kiswahili", "other", "Tell me a joke"));
    expect(await concierge.send("Nieleze kichekesho")).toMatchObject({ text: PHRASES.offTopic.kiswahili, route: "other", language: "kiswahili" });
    expect(requests).toHaveLength(1);
  });

  it("drops citations of extracts it never gave", async () => {
    const { concierge } = await make((r) =>
      isUnderstanding(r) ? understood("english", "help", "How long are my seats held while I pay?") : say("You have 10 minutes [paying#2]. Drinks are free [bar#1]."),
    );
    expect(await concierge.send("How long do I have to pay?")).toMatchObject({ text: "You have 10 minutes [paying#2]. Drinks are free.", sources: ["paying#2"] });
  });

  it("buys tickets in Kiswahili with Day 77's tools, still only after the fan confirms", async () => {
    let ticketCall = 0;
    const tickets = [
      callTool("quote_tickets", { eventId: 2, quantity: 2 }),
      callTool("buy_tickets", { quoteId: "Q1", phone: "0712345678" }), // too early: refused by the tool
      say("Tiketi 2 za Gengetone Block Party ni KES 1,600. Nikununulie? Nambari yako ya M-Pesa ni gani?"),
      callTool("buy_tickets", { quoteId: "Q1", phone: "0712 345 678" }),
      say("Tayari! Weka PIN yako ya M-Pesa ndani ya dakika 10."),
    ];
    const { concierge, requests, store } = await make((r) => {
      if (isUnderstanding(r)) {
        const text = String(r.body.messages[0].content);
        return text.startsWith("Ndio") ? understood("kiswahili", "other", "Yes, my number is 0712 345 678") : understood("kiswahili", "tickets", "Two tickets for the Gengetone party");
      }
      return tickets[ticketCall++];
    });

    const first = await concierge.send("Nataka tiketi mbili za Gengetone party");
    expect(first.route).toBe("tickets");
    expect(first.toolCalls.map((c) => c.name)).toEqual(["quote_tickets", "buy_tickets"]);
    expect(store.orders).toHaveLength(0);
    const ticketRequest = requests.find(isTickets)!.body as Body;
    expect(ticketRequest.system).toContain(REPLY_STYLE.kiswahili);

    // "Yes, here's my number" looks off-topic on its own; in a ticket conversation, it's the answer.
    const second = await concierge.send("Ndio, 0712 345 678");
    expect(second).toMatchObject({ route: "tickets", text: "Tayari! Weka PIN yako ya M-Pesa ndani ya dakika 10." });
    expect(store.orders).toEqual([{ id: 1, eventId: 2, quantity: 2, totalKes: 1600, phone: "254712345678" }]);
  });

  it("apologises in their language when a request is declined", async () => {
    const { concierge } = await make((r) => (isUnderstanding(r) ? understood("sheng", "help", "How do refunds work?") : refuse()));
    expect((await concierge.send("Refund inakaa aje?")).text).toBe(PHRASES.declined.sheng);
  });
});

describe("evaluating it in every language", () => {
  it("checks the reply came back in the language the fan used", async () => {
    const { repliesInLanguage } = await import("./starter/evals.ts");
    const { MULTILINGUAL_CASES } = await import("./starter/cases.ts");
    const sheng = MULTILINGUAL_CASES.find((c) => c.id === "refund-sheng")!;
    const { client, requests } = fakeClaude([understood("sheng", "help", "…"), understood("english", "help", "…")]);
    const grade = repliesInLanguage(client);
    expect(await grade(sheng, { text: "Doh yako inarudi ndani ya 3 working days.", sources: [] })).toEqual({ grader: "language", pass: true, reason: "Replied in sheng" });
    expect(await grade(sheng, { text: "Your money comes back within 3 working days.", sources: [] })).toEqual({
      grader: "language",
      pass: false,
      reason: "Asked in sheng, replied in english",
    });
    expect(requests[0].body.messages[0].content).toBe("Doh yako inarudi ndani ya 3 working days.");
    expect(await grade({ id: "x", question: "?" }, { text: "…", sources: [] })).toBeNull();
  });

  it("has a case for every language, and the same fact asked all three ways", async () => {
    const { MULTILINGUAL_CASES } = await import("./starter/cases.ts");
    expect(new Set(MULTILINGUAL_CASES.map((c) => c.language))).toEqual(new Set(["english", "kiswahili", "sheng"]));
    expect(MULTILINGUAL_CASES.filter((c) => c.id.startsWith("refund-")).map((c) => c.language)).toEqual(["english", "kiswahili", "sheng"]);
  });
});
