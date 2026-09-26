import { describe, it, expect, vi } from "vitest";
import { fakeClaude, say, refuse } from "./starter/fake-claude.ts";
import { HELP_CENTRE } from "./starter/help-centre.ts";
import { chunkPage, chunkAll, embeddingText, type Chunk } from "./starter/chunks.ts";
import { voyageEmbedder, hashingEmbedder, words, stem, fnv1a, VOYAGE_URL, type Embedder } from "./starter/embedders.ts";
import { cosine, buildIndex, search } from "./starter/retrieval.ts";
import { answerQuestion, NO_SOURCES } from "./starter/answer.ts";

describe("chunks", () => {
  it("cuts pages at paragraphs, joining short ones, and numbers the pieces", () => {
    const page = { id: "demo", title: "Demo", text: "One short.\n\nTwo short.\n\n" + "x".repeat(290) + "\n\n   Four,\n  across lines.  " };
    expect(chunkPage(page, 300)).toEqual([
      { id: "demo#1", pageId: "demo", title: "Demo", text: "One short. Two short." },
      { id: "demo#2", pageId: "demo", title: "Demo", text: "x".repeat(290) },
      { id: "demo#3", pageId: "demo", title: "Demo", text: "Four, across lines." },
    ]);
  });

  it("covers the whole help centre, with every piece at most the limit (unless a paragraph is longer)", () => {
    const chunks = chunkAll(HELP_CENTRE);
    expect(new Set(chunks.map((c) => c.pageId)).size).toBe(HELP_CENTRE.length);
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
    expect(chunks.length).toBeGreaterThan(HELP_CENTRE.length);
    expect(embeddingText(chunks[0])).toBe(`${chunks[0].title}\n${chunks[0].text}`);
  });
});

describe("the hashing embedder", () => {
  it("reads words the way a search does: lowercase, no accents, no filler, rough stems", () => {
    expect(words("The REFUNDS are refunded, café!")).toEqual(["refund", "refund", "cafe"]);
    expect(["tickets", "scanning", "cancelled", "bus", "used"].map(stem)).toEqual(["ticket", "scann", "cancell", "bus", "used"]);
    expect(fnv1a("tikiti")).toBe(fnv1a("tikiti"));
    expect(fnv1a("tikiti")).not.toBe(fnv1a("tiketi"));
  });

  it("gives texts that share words vectors that point the same way", async () => {
    const e = hashingEmbedder();
    const [refund, alsoRefund, gate] = await e.embed(["refund for a cancelled event", "cancelled event refund policy", "scan your code at the gate"], "document");
    expect(refund).toHaveLength(1024);
    expect(cosine(refund, alsoRefund)).toBeGreaterThan(0.5);
    expect(Math.abs(cosine(refund, gate))).toBeLessThan(0.2);
  });
});

describe("cosine similarity", () => {
  it("measures direction, not length", () => {
    expect(cosine([1, 0], [5, 0])).toBe(1);
    expect(cosine([1, 0], [0, 3])).toBe(0);
    expect(cosine([1, 1], [-1, -1])).toBeCloseTo(-1);
    expect(cosine([0, 0], [1, 1])).toBe(0);
    expect(() => cosine([1], [1, 2])).toThrow();
  });
});

describe("the Voyage embedder", () => {
  function fakeVoyage() {
    return vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init!.body)) as { input: string[] };
      // Send the embeddings back shuffled: the index says which is which.
      const data = body.input.map((text, index) => ({ object: "embedding", embedding: [text.length, index], index })).reverse();
      return Response.json({ object: "list", data, model: "voyage-4", usage: { total_tokens: 10 } });
    });
  }

  it("asks Voyage for embeddings, as a query or a document, and keeps them in order", async () => {
    const fetchFn = fakeVoyage();
    const voyage = voyageEmbedder({ apiKey: "pa-test", fetch: fetchFn });
    expect(await voyage.embed(["a", "bb", "ccc"], "document")).toEqual([[1, 0], [2, 1], [3, 2]]);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(VOYAGE_URL);
    expect(new Headers(init!.headers).get("Authorization")).toBe("Bearer pa-test");
    expect(JSON.parse(String(init!.body))).toEqual({ input: ["a", "bb", "ccc"], model: "voyage-4", input_type: "document" });
    expect(voyage.name).toBe("voyage-4");
  });

  it("sends big jobs in batches of 128", async () => {
    const fetchFn = fakeVoyage();
    const vectors = await voyageEmbedder({ apiKey: "k", fetch: fetchFn }).embed(Array.from({ length: 300 }, (_, i) => `t${i}`), "query");
    expect(fetchFn.mock.calls.map(([, init]) => (JSON.parse(String(init!.body)) as { input: string[] }).input.length)).toEqual([128, 128, 44]);
    expect(vectors).toHaveLength(300);
    expect(vectors[299]).toEqual([4, 43]);
  });

  it("says what went wrong", async () => {
    const fetchFn = vi.fn(async () => new Response('{"detail":"Invalid API key"}', { status: 401 }));
    await expect(voyageEmbedder({ apiKey: "bad", fetch: fetchFn }).embed(["x"], "query")).rejects.toThrow(/401.*Invalid API key/);
  });
});

describe("search", () => {
  it("finds the right part of the help centre", async () => {
    const index = await buildIndex(hashingEmbedder(), chunkAll(HELP_CENTRE));
    const top = async (q: string) => (await search(index, q))[0]?.chunk.id;
    expect(await top("Will I get a refund if the event is cancelled?")).toBe("refunds#2");
    expect(await top("The M-Pesa prompt never arrived")).toBe("paying#1");
    expect(await top("I lost my phone, where are my tickets?")).toBe("lost-phone#1");
    expect(await top("How much does Tikiti charge organisers?")).toBe("organisers#1");
  });

  it("finds nothing rather than something weak", async () => {
    const index = await buildIndex(hashingEmbedder(), chunkAll(HELP_CENTRE));
    expect(index.vectors).toHaveLength(index.chunks.length);
    expect((await search(index, "Will I get a refund?")).length).toBeGreaterThan(0); // it can find things...
    expect(await search(index, "What is the capital of France?")).toEqual([]); // ...so this empty list means something
  });

  it("embeds documents once, as documents, and each question as a query; best first, at most k", async () => {
    const calls: string[] = [];
    const embedder: Embedder = {
      name: "fixed",
      embed: async (texts, kind) => {
        calls.push(`${kind}:${texts.length}`);
        return texts.map((t) => (t.includes("Refunds") ? [1, 0] : t.includes("Paying") ? [0.6, 0.8] : t.startsWith("Q") ? [1, 0.1] : [0, 1]));
      },
    };
    const chunks: Chunk[] = [
      { id: "a#1", pageId: "a", title: "Refunds", text: "…" },
      { id: "b#1", pageId: "b", title: "Paying", text: "…" },
      { id: "c#1", pageId: "c", title: "Other", text: "…" },
    ];
    const index = await buildIndex(embedder, chunks);
    const hits = await search(index, "Q?", 2);
    expect(hits.map((h) => h.chunk.id)).toEqual(["a#1", "b#1"]);
    expect(hits[0].score).toBeGreaterThan(hits[1].score);
    expect(calls).toEqual(["document:3", "query:1"]);
  });
});

describe("answering from sources", () => {
  const indexed = () => buildIndex(hashingEmbedder(), chunkAll(HELP_CENTRE));

  it("gives the model only the extracts it found, and keeps the citations", async () => {
    const { client, requests } = fakeClaude([say("Yes: if an event is cancelled you're refunded automatically to the M-Pesa number that paid, within 3 working days [refunds#2].")]);
    const answer = await answerQuestion(client, await indexed(), "Will I get a refund if the event is cancelled?");
    expect(answer.sources).toEqual(["refunds#2"]);
    expect(answer.retrieved[0]).toBe("refunds#2");
    expect(answer.text).toContain("[refunds#2]");
    const prompt = requests[0].body.messages[0].content as string;
    expect(prompt).toContain('<extract id="refunds#2" title="Refunds">');
    expect(prompt).toContain("within 3 working days");
    expect(prompt).not.toContain("Doors usually open"); // nothing that wasn't found
    expect(prompt.endsWith("Question: Will I get a refund if the event is cancelled?")).toBe(true);
    expect(requests[0].body).toMatchObject({ model: "claude-opus-5", fallbacks: "default" });
  });

  it("takes out citations of extracts it was never given", async () => {
    const { client } = fakeClaude([say("Refunds take 3 working days [refunds#2]. You also get a free drink [bar#1].")]);
    const answer = await answerQuestion(client, await indexed(), "Will I get a refund if the event is cancelled?");
    expect(answer.sources).toEqual(["refunds#2"]);
    expect(answer.text).toBe("Refunds take 3 working days [refunds#2]. You also get a free drink.");
  });

  it("doesn't ask the model at all when nothing relevant was found", async () => {
    const { client, requests } = fakeClaude([]);
    expect(await answerQuestion(client, await indexed(), "What is the capital of France?")).toEqual({ text: NO_SOURCES, sources: [], retrieved: [] });
    expect(requests).toHaveLength(0);
  });

  it("falls back to 'ask support' when the model declines", async () => {
    const { client } = fakeClaude([refuse()]);
    const answer = await answerQuestion(client, await indexed(), "The M-Pesa prompt never arrived");
    expect(answer).toMatchObject({ text: NO_SOURCES, sources: [] });
  });
});
