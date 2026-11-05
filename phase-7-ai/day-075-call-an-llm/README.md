# Day 75: Call an LLM — The Tikiti Concierge

Watch the video: *(not recorded yet)*

## The brief

Phase 7 hands the ticketing platform to an AI. It starts with a concierge: fans ask questions in plain language ("I ordered, now what?", "can I get a refund?") and get answers that sound like the friendly person at the box office.

```
$ node phase-7-ai/day-075-call-an-llm/starter/chat.ts
Tikiti concierge. Ask about tickets, M-Pesa or getting in. Ctrl+D to leave.

> I paid but I can't find my ticket
Your tickets are under "My tickets" once you're logged in, each with a code like
T12-9F3AC1D277B0E4A1. Show that at the gate and you're in.

  (1180 in, 52 out: KES 0.93, KES 0.93 so far)
```

## How calling a model works

One HTTP request to Anthropic's Messages API, made with the official SDK (`@anthropic-ai/sdk`):

- **`system`** is the brief: who the concierge is, what it knows, what it shouldn't do. It's in `prompt.ts`. It reads like a note to a new colleague, because that's what works best.
- **`messages`** is the conversation so far. The API remembers **nothing** between calls: every request sends the whole conversation again. That's why the history includes the model's own replies.
- **`model`** is Claude Opus 5, **`max_tokens`** is how long the answer may be, and **`output_config.effort`** is how hard it thinks. A chat reply doesn't need deep thought, so `"low"` makes it faster and cheaper.
- **The answer** is a list of content blocks, not a string. Take the text blocks, and **check `stop_reason` first**: `"refusal"` means a safety classifier declined; `"max_tokens"` means it ran out of room mid-sentence.
- **`fallbacks: "default"`** asks the API to re-run a declined request on the model Anthropic recommends for that kind of decline, inside the same call, instead of just returning the refusal.
- **Streaming** sends the answer as it's written, so a fan watches it appear instead of waiting several seconds for nothing.

## Tests without the internet

`fake-claude.ts` is a real Anthropic client whose network calls never leave your computer. Tests script what "Claude" answers: text, a refusal, a 429, a streamed reply. They also read back exactly what your code sent. No API key, no cost, and the same answer every time. From here on, every AI day is tested this way.

## Steps

1. Read `prompt.ts`, then `fake-claude.ts`.
2. `buildRequest`, `textOf`, then `ask`. `npm test -- day-075 -t ask`.
3. `explainError`: use the SDK's error classes (`instanceof Anthropic.RateLimitError`), never the message text.
4. `Conversation.send`, streaming, and keeping the history right when things go wrong.
5. `costKes`: know what each answer costs before you ship it to thousands of fans.
6. Run the tests, then talk to it for real, if you have an API key:

   ```bash
   npm test -- day-075
   export ANTHROPIC_API_KEY=sk-ant-...      # or: ant auth login
   node phase-7-ai/day-075-call-an-llm/starter/chat.ts
   ```

## Check yourself

1. The fan's second message is "and for a group?". Why does `Conversation` send the first question and the first answer again, instead of just the new message?
2. Spot the bug: `return message.content[0].text;`. Name two ways it goes wrong.
3. Predict the output: `costKes({ input_tokens: 1180, output_tokens: 52 })` and `costKes({ input_tokens: 0, output_tokens: 1_000_000 })`
4. Why does `explainError` use `error instanceof Anthropic.RateLimitError` rather than checking whether `error.message` contains "rate limit"?

<details><summary>Answers</summary>

1. The API remembers nothing between calls. Each request has to carry the whole conversation, the model's own replies included, or "for a group?" means nothing.
2. It doesn't compile: the first block might not be text, so narrow with `block.type === "text"`, and a reply can have several text blocks. It also ignores `stop_reason`, so a refusal or an answer cut off at `max_tokens` would be shown as if it were a real answer.
3. `0.93` and `3225`. That's $0.0072 and $25 at 129 shillings to the dollar, rounded to the cent.
4. The error classes are part of the SDK's contract. Message text is for people, and it can change in any release without warning.

</details>

## When you're stuck

- **`Property 'text' does not exist`** — a content block could be text, thinking, a tool call... Narrow it first: `block.type === "text"`.
- **The model forgets what was said** — push the assistant's reply into the history too, with its full `content`.
- **The second message fails after a refusal** — the declined question is still in the history. Take it out.
- **Still stuck?** Read `solution/concierge.ts`, then close it and write your own from memory.
