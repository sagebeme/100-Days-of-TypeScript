# Day 80: Capstone — A Concierge That Speaks Sheng, Kiswahili and English

Watch the video: *(not recorded yet)*

## The brief

Tikiti's fans don't all write in English. Some write standard Kiswahili, and a lot write Sheng:

```
> Manze, doh yangu itarudi kama event imecancelliwa?
Sawa manze, kama event imecancelliwa doh yako inarudi kwa M-Pesa ndani ya 3 working days,
huhitaji kufanya kitu [refunds#2].
  (sheng · help)

> Nataka tiketi mbili za Gengetone party
Tiketi 2 za Gengetone Block Party ni KES 1,600. Nikununulie? Nambari yako ya M-Pesa ni gani?
  (kiswahili · tickets · → quote_tickets)
```

Today's concierge answers everyone in the language they used, from the same help centre and with the same tools and rules. It's built from everything in Phase 7.

## How it fits together

```
message ─→ understand (Day 76: structured output)
             language: english | kiswahili | sheng
             route:    help | tickets | other
             searchQuery: the question, in plain English
                │
     ┌──────────┼──────────────────────┐
     help       tickets                other
     │          │                      │
  Day 78: search with the          a fixed reply in their
  English rewrite, answer          language: no model needed
  in their language, check
  citations
                Day 77: tools and the buy guardrail,
                replying in their language
```

Then **Day 79** evaluates it: the same facts asked in all three languages, plus a grader that checks each reply came back in the language it was asked in.

## The trick: search in English, answer in Sheng

The help centre is in English, and Day 78's search matches words. "Doh yangu itarudi kama event imecancelliwa?" shares no words with the refunds page, so it finds nothing (there's a test that shows it). So the understanding step also rewrites the question in plain English: "Will I get my money back if the event is cancelled?". That is what gets searched. The answer, though, is written for the original question, in the original language.

Building this turned up the catch: the rewrite *is* a search query. "How long do I have to pay?" finds nothing with a word-matching search, while "How long are my seats held while I pay?" finds the right paragraph. The words the rewrite uses matter, and so does a better embedder (Voyage).

## One more subtlety: conversations have memory

"Ndio, 0712 345 678" looks off-topic on its own. In a conversation where the concierge just asked "Shall I buy them? What's your M-Pesa number?", it's the answer. So once a ticket conversation is under way, the concierge keeps sending messages to it, unless the fan clearly asks a help question.

## Before you start

This day uses your code from Days 77 (tools), 78 (retrieval) and 79 (evals), imported as they are. Finish those first.

## Steps

1. Read `languages.ts`: the three languages, how to reply in each, and the fixed replies.
2. `understand.ts`. `npm test -- day-080 -t understanding`.
3. `concierge.ts`: `create`, then `send` and its three routes.
4. `evals.ts`: `repliesInLanguage`.
5. Run the tests, then talk to it, and run the eval in all three languages, if you have an API key:

   ```bash
   npm test -- day-080
   node phase-7-ai/day-080-multilingual-concierge/starter/chat.ts
   node phase-7-ai/day-080-multilingual-concierge/starter/run-evals.ts
   ```

## When you're stuck

- **Sheng questions find nothing in the help centre** — search with `searchQuery`, not the message.
- **Replies come back in English** — add `REPLY_STYLE[language]` to the system prompt of the call that writes the reply.
- **"Ndio" gets the off-topic reply** — once there's ticket history, stay on the tickets route unless it's a help question.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.

## Phase 7 done

Six days ago Tikiti had no AI in it. Now it has a concierge that:

- calls Claude properly: stop reasons, fallbacks, typed errors, streaming and cost;
- turns messy text into checked data;
- takes actions with tools, behind guardrails written in code;
- answers from sources and checks its citations;
- is measured by an eval;
- speaks the way its fans do.

Phase 8 is yours: twenty projects, a brief and a test suite each, and no walkthrough.
