import Anthropic from "@anthropic-ai/sdk";

// Already written: a pretend Claude, for tests. It's a real Anthropic client whose `fetch` never
// leaves your computer: it records every request your code sends, and answers each one with the
// next reply you scripted, streamed or not, exactly the way the real API shapes its answers.
// Your code can't tell the difference, and a test never costs money or needs a network.

export type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

export interface Reply {
  content: Block[];
  stop_reason?: "end_turn" | "max_tokens" | "tool_use" | "refusal";
  stop_details?: { type: "refusal"; category: string | null; explanation: string | null } | null;
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
  model?: string;
  status?: number; // answer with an HTTP error instead, e.g. 429
  error?: { type: string; message: string };
}

export interface RecordedRequest {
  body: Record<string, unknown> & { messages: { role: string; content: unknown }[] };
  headers: Record<string, string>;
}

// Shorthands for scripting replies.
export const say = (text: string, usage = { input_tokens: 120, output_tokens: 40 }): Reply => ({ content: [{ type: "text", text }], usage });
export const refuse = (category = "cyber"): Reply => ({
  content: [],
  stop_reason: "refusal",
  stop_details: { type: "refusal", category, explanation: "Declined by a safety classifier" },
});
export const httpError = (status: number, type: string, message: string): Reply => ({ content: [], status, error: { type, message } });
let toolIds = 0;
export const callTool = (name: string, input: unknown, text?: string): Reply => ({
  content: [...(text ? [{ type: "text" as const, text }] : []), { type: "tool_use", id: `toolu_${++toolIds}`, name, input }],
  stop_reason: "tool_use",
});

function message(reply: Reply, model: string) {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 10)}`,
    type: "message",
    role: "assistant",
    model: reply.model ?? model,
    content: reply.content,
    stop_reason: reply.stop_reason ?? "end_turn",
    stop_sequence: null,
    stop_details: reply.stop_details ?? null,
    usage: reply.usage ?? { input_tokens: 100, output_tokens: 30 },
  };
}

// The same answer as server-sent events, split into small pieces, as the real API streams it.
function stream(reply: Reply, model: string): string {
  const full = message(reply, model);
  const events: [string, unknown][] = [
    ["message_start", { type: "message_start", message: { ...full, content: [], stop_reason: null, usage: { ...full.usage, output_tokens: 0 } } }],
  ];
  reply.content.forEach((block, index) => {
    if (block.type === "text") {
      events.push(["content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } }]);
      for (const piece of block.text.match(/.{1,8}/gs) ?? []) {
        events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text: piece } }]);
      }
    } else {
      events.push(["content_block_start", { type: "content_block_start", index, content_block: { ...block, input: {} } }]);
      events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(block.input) } }]);
    }
    events.push(["content_block_stop", { type: "content_block_stop", index }]);
  });
  events.push([
    "message_delta",
    { type: "message_delta", delta: { stop_reason: full.stop_reason, stop_sequence: null, stop_details: full.stop_details }, usage: { output_tokens: full.usage.output_tokens } },
  ]);
  events.push(["message_stop", { type: "message_stop" }]);
  return events.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join("");
}

export function fakeClaude(script: Reply[] | ((request: RecordedRequest, index: number) => Reply)) {
  const requests: RecordedRequest[] = [];
  const client = new Anthropic({
    apiKey: "sk-ant-test-not-a-real-key",
    maxRetries: 0, // the tests decide what happens after an error
    fetch: async (_url, init) => {
      const recorded: RecordedRequest = {
        body: JSON.parse(String(init?.body)),
        headers: Object.fromEntries(new Headers(init?.headers).entries()),
      };
      requests.push(recorded);
      const index = requests.length - 1;
      const reply = typeof script === "function" ? script(recorded, index) : script[index];
      if (!reply) throw new Error(`The pretend Claude has no reply scripted for request ${index + 1}`);
      if (reply.status) return Response.json({ type: "error", error: reply.error }, { status: reply.status });
      const model = String(recorded.body.model);
      return recorded.body.stream
        ? new Response(stream(reply, model), { headers: { "content-type": "text/event-stream" } })
        : Response.json(message(reply, model));
    },
  });
  return { client, requests };
}
