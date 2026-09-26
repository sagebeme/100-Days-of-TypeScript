# Day 76: Structured Output — From a WhatsApp Post to an Event

Watch the video: *(not recorded yet)*

## The brief

Organisers don't fill in forms; they post on WhatsApp:

```
🔥 GENGETONE BLOCK PARTY 🔥 jumamosi hii!! Kasarani Annex from 3pm till late.
Mtaa Sound x Odi Rider + Kaka Bass, DJ Shiko on the decks. Regular 800, VIP 2k. 18+ only
```

Today Tikiti turns that into an event draft the ticketing API can use:

```json
{
  "title": "Gengetone Block Party",
  "venue": "Kasarani Annex",
  "startsAt": "2026-12-05T15:00:00+03:00",
  "genre": "gengetone",
  "tiers": [{ "name": "Regular", "priceKes": 800 }, { "name": "VIP", "priceKes": 2000 }],
  "capacity": null,
  "ageLimit": 18,
  "missing": ["How many people can the venue hold?", "When does it end?"]
}
```

Notice the `null` and the `missing` list. A draft that admits what it doesn't know is worth far more than one that confidently invents a capacity.

## Three layers of trust

1. **Structured output** (`output_config.format`, built from a Zod schema with `betaZodOutputFormat`) makes the model answer in the schema's *shape*: the right fields, the right types, nothing extra.
2. **Your own Zod check.** Look at the request the tests capture: some rules, such as lengths, number limits and even the genre list, travel only as *hints* in a description. So check the answer with `safeParse`. When it fails, send the model its exact mistakes ("genre: Invalid option") and give it one more try. That fixes most slips for the price of one extra call.
3. **Plain code for what no schema can say.** Is the date in the past? Does it end before it starts? Is the same act listed twice? These are facts about the world, so ordinary code checks them, every time.

## What you'll use

- `z.iso.datetime({ offset: true })`, `.nullable()`, `.describe()`: the descriptions go to the model as instructions
- `betaZodOutputFormat(schema)` in `output_config.format`
- `z.ZodError` issues, turned into feedback the model can act on
- Today's date in the prompt, in Nairobi time, so "jumamosi hii" (this Saturday) means a real date

## Steps

1. Read `prompt.ts`: "never invent", and what to do instead.
2. `EventDraftSchema`.
3. `extractEvent`, with its one retry. `npm test -- day-076 -t extractEvent`.
4. `checkDraft` and `toEventRequest`.
5. Run the tests, then try it on a real announcement, if you have an API key:

   ```bash
   npm test -- day-076
   node phase-7-ai/day-076-structured-output/starter/extract.ts < my-flyer.txt
   ```

## When you're stuck

- **"this Saturday" becomes last Saturday, or a year ago** — the model only knows today's date if you tell it, in the first message.
- **The retry doesn't fix anything** — send the model's reply back as the assistant turn, then the problems, so it can see what it said and what was wrong.
- **Tests fail on field order** — `z.object` keeps the order you write the fields in, and so does the JSON schema sent to the model.
- **Still stuck?** Read `solution/event-draft.ts`, then close it and write your own from memory.
