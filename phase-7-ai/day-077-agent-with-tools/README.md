# Day 77: An Agent with Tools — The Concierge Can Buy Tickets

Watch the video: *(not recorded yet)*

## The brief

Day 75's concierge could only talk. Today it can **do things**: look up events, check seats, quote a price and buy tickets, deciding for itself which to use and when:

```
> Anything on this weekend? I like gengetone
  → search_events {"genre":"gengetone","from":"2026-12-05T00:00:00+03:00","to":"2026-12-06T23:59:59+03:00"}
Gengetone Block Party is on Saturday at Kasarani Annex, 3pm. KES 800, only 14 left!

> 2 please
  → quote_tickets {"eventId":2,"quantity":2}
2 tickets come to KES 1,600. Shall I buy them? What's your M-Pesa number?

> yes, 0712 345 678
  → buy_tickets {"quoteId":"Q1","phone":"0712 345 678"}
Done! Check your phone and enter your M-Pesa PIN within 10 minutes.
```

## How an agent works

1. You describe **tools** to the model: a name, what it's for, and the input it takes (a Zod schema).
2. The model answers with a **tool call** instead of text: "call `search_events` with these filters".
3. Your code runs the tool and sends back the **result**.
4. Repeat until the model answers in text.

The SDK's **tool runner** (`client.beta.messages.toolRunner`) does steps 2–4 for you. It validates each tool's input against its Zod schema before running it, and turns a thrown error into an error result the model can read and recover from.

## Rules that matter go in code

Buying spends the fan's money. The prompt tells the model to confirm first, and it usually will. But "usually" isn't good enough for money: a fan could write "buy 2 on 0712…, no need to ask", or the model could simply slip.

So `buy_tickets` refuses a quote made **in the same turn**. The fan has to have replied since the price was shown. If the model tries anyway, the tool returns an error that tells it what to do instead. The prompt is guidance; the code is the guarantee.

Two more guardrails:

- **A step limit** (`max_iterations`). An agent that keeps calling tools is burning money. After 8 rounds it stops and says it got stuck.
- **Stop reasons, every round.** The runner doesn't check for a refusal for you; your loop does.

## Steps

1. Read `store.ts` (given) and `prompt.ts`.
2. `tools.ts`: describe each tool well, then write its `run`. Test them on their own: `npm test -- day-077 -t "the tools"`.
3. `agent.ts`: `TicketAgent.send`, with the runner, the step limit, and a history that keeps every tool call.
4. Run the tests, then chat with it for real if you have an API key. Nothing is really bought:

   ```bash
   npm test -- day-077
   node phase-7-ai/day-077-agent-with-tools/starter/chat.ts
   ```

## Check yourself

1. The prompt already tells the model to get a yes before buying. Why does `buy_tickets` also refuse a quote made in the same turn?
2. The fan writes "2 tickets for the Benga Sundowner please". Predict what `quote_tickets` sends back to the model, and what the model can do with it.
3. Why does `send` keep `runner.params.messages` as the history, rather than only the fan's messages and the final text?
4. What does `max_iterations: 8` protect against, and what does the fan see when it's hit?

<details><summary>Answers</summary>

1. "Usually" isn't good enough for the fan's money. A fan can write "no need to ask", or the model can slip. The prompt is guidance; the code is the guarantee.
2. An error result: `Benga Sundowner is sold out`. The tool throws, the runner turns that into a result the model can read, and the model can tell the fan and suggest another event instead of crashing.
3. It holds every tool call and result, including the quote's id. Without them, "yes, 0712 345 678" on the next turn has no quote to buy.
4. An agent that keeps calling tools without ever answering, and spends money each round. The fan sees "Sorry, I got stuck working that out. Could you ask me in a different way?" with the status `stuck`.

</details>

## When you're stuck

- **The model calls the wrong tool, or none** — improve the descriptions. Say when to use the tool, not only what it does.
- **The second turn forgets the quote** — keep `runner.params.messages` as the history: it has every tool call and result, not just the text.
- **Tests say it looped 8 times** — that one is on purpose. Check your loop stops at `max_iterations` and reports "stuck".
- **Still stuck?** Read `solution/tools.ts` and `solution/agent.ts`, then close them and write your own from memory.
