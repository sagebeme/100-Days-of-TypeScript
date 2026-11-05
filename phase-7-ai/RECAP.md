# Phase 7 Recap: AI in TypeScript

Days 75–80. You handed the ticketing platform to an AI: a concierge that answers fans, turns WhatsApp posts into event drafts, buys tickets with tools, answers from the help centre with sources, is measured by an eval, and speaks Sheng, Kiswahili and English.

## What this phase taught

Calling a model properly, structured output, agents with tools and guardrails, embeddings and retrieval, evals, and putting them together into one system. Every day was tested against a fake Claude, with no API key and no cost.

## Key ideas

1. **The API remembers nothing.** Every request sends the whole conversation, the model's own replies included (Day 75).
2. **Check why it stopped before trusting what it said.** A reply is a list of blocks, and `stop_reason` says whether it's an answer, a refusal or cut short at `max_tokens`. Errors are told apart by the SDK's classes, never their message text (Day 75).
3. **Know the cost.** Input and output tokens have different prices, so work out what each answer costs before thousands of fans ask (Day 75).
4. **Three layers of trust for structured output.** The schema fixes the shape; your own Zod check catches what only travelled as a hint, with one retry that names the mistakes; plain code checks facts about the world, like a date in the past (Day 76).
5. **Rules that matter go in code.** The prompt asks the model to confirm before buying; the tool refuses a quote from the same turn, whatever the model thinks. A step limit stops an agent that loops (Day 77).
6. **Retrieve, then answer from sources, then check them.** Embed chunks once, find the few closest to the question by cosine similarity, keep none if nothing scores well, and remove any citation that wasn't among the extracts (Day 78).
7. **Measure instead of guessing.** An eval runs real questions through code graders first and a narrow LLM judge only for what code can't check, and a comparison lists regressions before anything else (Day 79).
8. **Search in one language, answer in another.** A structured understanding step rewrites the question in plain English for retrieval, and the reply is written in the language the fan used (Day 80).

## Self-test

1. Why does a declined question come out of the conversation history?
2. Structured output guarantees the shape. Name one thing it doesn't guarantee.
3. Why does a word-matching embedder miss "can I bring someone to help me with my wheelchair?", and what would find it?
4. A judge's reply can't be parsed. Pass or fail, and why?
5. Why does the eval runner write each result into its case's slot instead of pushing it onto a list?

<details><summary>Answers</summary>

1. Left in, it's still there on the next request, and the next message fails or is declined too.
2. Rules that reach the model only as hints in a description: lengths, number limits, even the list of genres. And facts about the world: whether the date has already passed.
3. The help page talks about "a companion who helps you", which shares no useful words with the question. An embedding model that understands meaning, like Voyage, should find it.
4. Fail. A judge that can't give a verdict must never let an answer through silently.
5. Workers finish in any order, so pushing would mix the results up.

</details>

## Build it without steps

**A matatu lost-and-found assistant.** Riders describe what they lost in English, Kiswahili or Sheng ("niliacha bag yangu kwa 46 jana jioni"). Turn each message into a structured report (item, route, time, colour, contact) with a schema and code checks, answer questions from a small policy page with checked citations, and let staff search found items with a tool. Write an eval of at least ten real-sounding messages, in all three languages, with code graders, and run it against a fake client in your tests.

No steps and no starter. Decide what code must guarantee before you write a single prompt.
