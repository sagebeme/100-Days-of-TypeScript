import { describe, it, expect } from "vitest";
import Anthropic from "@anthropic-ai/sdk";
import { fakeClaude, say, refuse, httpError } from "./starter/fake-claude.ts";
import { MODEL, buildRequest, ask, textOf, explainError, Conversation, costKes, DECLINED, CUT_SHORT } from "./starter/concierge.ts";
import { SYSTEM_PROMPT } from "./starter/prompt.ts";

describe("the request", () => {
  it("uses Opus 5, the concierge's brief, low effort, and fallbacks", () => {
    const request = buildRequest([{ role: "user", content: "How do I pay?" }]);
    expect(MODEL).toBe("claude-opus-5");
    expect(request).toMatchObject({
      model: "claude-opus-5",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: "How do I pay?" }],
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    expect(request.max_tokens).toBeGreaterThanOrEqual(4000); // room to answer: a cut-off answer costs a retry
  });

  it("is what actually reaches the API", async () => {
    const { client, requests } = fakeClaude([say("You pay with M-Pesa.")]);
    await ask(client, "How do I pay?");
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toMatchObject({ model: "claude-opus-5", fallbacks: "default", system: SYSTEM_PROMPT });
    expect(requests[0].headers["anthropic-beta"]).toBe("server-side-fallback-2026-07-01");
  });
});

describe("ask", () => {
  it("returns the text of the answer, and who answered", async () => {
    const { client } = fakeClaude([say("Check your phone and enter your M-Pesa PIN.")]);
    expect(await ask(client, "I ordered, now what?")).toMatchObject({
      text: "Check your phone and enter your M-Pesa PIN.",
      status: "answered",
      model: "claude-opus-5",
      usage: { input_tokens: 120, output_tokens: 40 },
    });
  });

  it("joins every text block, and skips blocks that aren't text", () => {
    expect(
      textOf([
        { type: "text", text: "Karibu! ", citations: null },
        { type: "thinking", thinking: "", signature: "x" },
        { type: "text", text: "Uko sawa?", citations: null },
      ] as Anthropic.Beta.BetaContentBlock[]),
    ).toBe("Karibu! Uko sawa?");
  });

  it("checks why it stopped: a declined request, and an answer that ran out of room", async () => {
    const { client } = fakeClaude([refuse(), { content: [{ type: "text", text: "Refunds go back to" }], stop_reason: "max_tokens" }]);
    expect(await ask(client, "…")).toMatchObject({ status: "declined", text: DECLINED });
    expect(await ask(client, "…")).toMatchObject({ status: "cut-short", text: `Refunds go back to\n${CUT_SHORT}` });
  });

  it("says which model answered when a fallback stepped in", async () => {
    const { client } = fakeClaude([{ ...say("Sure."), model: "claude-opus-4-8" }]);
    expect((await ask(client, "…")).model).toBe("claude-opus-4-8");
  });
});

describe("errors", () => {
  it("turns each kind of API error into something a person can act on", async () => {
    const cases: [number, string, RegExp][] = [
      [401, "authentication_error", /ANTHROPIC_API_KEY/],
      [429, "rate_limit_error", /very busy/],
      [400, "invalid_request_error", /bug on our side/],
      [529, "overloaded_error", /problem on its side/],
    ];
    for (const [status, type, expected] of cases) {
      const { client } = fakeClaude([httpError(status, type, "details")]);
      const error = await ask(client, "…").catch((e: unknown) => e);
      expect(explainError(error)).toMatch(expected);
    }
    expect(explainError(new Error("?"))).toBe("Something went wrong.");
  });
});

describe("a conversation", () => {
  it("streams each reply as it's written", async () => {
    const { client } = fakeClaude([say("Your seats are held for ten minutes while you pay.")]);
    const pieces: string[] = [];
    const answer = await new Conversation(client).send("How long do I have?", (piece) => pieces.push(piece));
    expect(pieces.length).toBeGreaterThan(3);
    expect(pieces.join("")).toBe("Your seats are held for ten minutes while you pay.");
    expect(answer.text).toBe(pieces.join(""));
  });

  it("sends the whole conversation every time, because the API remembers nothing", async () => {
    const { client, requests } = fakeClaude([say("Hi Amina! How can I help?"), say("Up to 10 people per order.")]);
    const chat = new Conversation(client);
    await chat.send("Hi, I'm Amina");
    await chat.send("How many tickets can I buy?");
    expect(requests[1].body.stream).toBe(true);
    expect(requests[1].body.messages).toEqual([
      { role: "user", content: "Hi, I'm Amina" },
      { role: "assistant", content: [{ type: "text", text: "Hi Amina! How can I help?" }] },
      { role: "user", content: "How many tickets can I buy?" },
    ]);
    expect(chat.history).toHaveLength(4);
  });

  it("keeps going after a declined question, and after an error, as if they were never asked", async () => {
    const { client, requests } = fakeClaude([refuse(), httpError(429, "rate_limit_error", "slow down"), say("Karibu!")]);
    const chat = new Conversation(client);
    expect((await chat.send("something odd")).status).toBe("declined");
    await expect(chat.send("hello?")).rejects.toBeInstanceOf(Anthropic.RateLimitError);
    await chat.send("Habari");
    expect(requests[2].body.messages).toEqual([{ role: "user", content: "Habari" }]);
    expect(chat.history).toHaveLength(2);
  });
});

describe("cost", () => {
  it("works out what a reply cost in shillings", () => {
    expect(costKes({ input_tokens: 1_000_000, output_tokens: 0 }, 100)).toBe(500);
    expect(costKes({ input_tokens: 0, output_tokens: 1_000_000 }, 100)).toBe(2500);
    expect(costKes({ input_tokens: 1200, output_tokens: 150 })).toBe(1.26); // a typical answer: about a shilling
    expect(costKes({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 0 }, 100)).toBe(50);
  });
});
