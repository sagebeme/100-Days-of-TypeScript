# Day 78: Embeddings and Retrieval — Answers From the Help Centre

Watch the video: *(not recorded yet)*

## The brief

The concierge's knowledge lives in a system prompt, which works for a paragraph of facts and not for a help centre. Tikiti's help centre has pages on paying, refunds, the gate, lost phones, groups and accessibility, and it will keep growing. Pasting all of it into every request is slow and expensive, and the model gets lost in it.

Instead: **find the two or three pieces that matter for this question, and give the model only those**, asking it to say which ones it used:

```
$ node …/ask.ts "Will I get my money back if it's cancelled?"
  0.31  refunds#2  If an event is cancelled, everyone who bought tickets gets their money…
  0.20  refunds#3  If an event moves to a new date, your ticket is valid on the new date…

Yes. If an event is cancelled you're refunded automatically to the M-Pesa number that
paid, within 3 working days, and you don't need to do anything [refunds#2].

Sources: refunds#2
```

That's **retrieval-augmented generation** (RAG).

## The pieces

1. **Chunks.** A page is cut into paragraph-sized pieces. "What if it's cancelled?" is about one paragraph of the refunds page, not the whole page.
2. **Embeddings.** An embedder turns text into a vector: a list of numbers where texts that mean similar things point in similar directions. Every chunk is embedded once, ahead of time. Each question is embedded when it arrives.
3. **Search.** Compare the question's vector with every chunk's using **cosine similarity** (the angle between them, ignoring length), and keep the best few. Keep none if nothing scores well: three weak matches are worse than none, because the model will try to use them.
4. **Answer, with checked sources.** The model answers only from the extracts, citing them like `[refunds#2]`. Then your code checks every citation was really among the extracts, and removes any that weren't.

## Two embedders, one interface

- **`voyageEmbedder`** calls Voyage AI (`voyage-4`, 1024 numbers per text), the embedding models Anthropic recommends; Claude itself doesn't make embeddings. It understands *meaning*: "money back" finds the refunds page.
- **`hashingEmbedder`** needs no model and no network. Every word and word pair is hashed into one of 1024 slots. It's how the tests run, and it shows you exactly what a real model adds. It matches **words**, not meanings: ask "can I bring someone to help me with my wheelchair?" and it finds nothing, because the accessibility page talks about "a companion who helps you". Voyage finds it.

Building this turned up a lesson in hashing: with 512 slots, "What time do doors open?" missed the page that says "Doors usually open…". Too many words were landing in the same slots and cancelling each other out. 1024 slots fixed it.

## Steps

1. `chunks.ts`: `chunkPage`.
2. `embedders.ts`: `hashingEmbedder`, then `voyageEmbedder` (tested with a pretend Voyage, like the pretend Claude).
3. `retrieval.ts`: `cosine`, `buildIndex`, `search`. Try it with no API calls at all:

   ```bash
   node phase-7-ai/day-078-embeddings-and-retrieval/starter/ask.ts --search-only "the M-Pesa prompt never came"
   ```

4. `answer.ts`: `answerQuestion`, and checking the citations.
5. Run the tests. Then, with keys, compare the two embedders on the wheelchair question.

   ```bash
   npm test -- day-078
   ```

## When you're stuck

- **Everything scores about the same** — check that `cosine` divides by both lengths.
- **Voyage's embeddings are matched to the wrong texts** — sort `data` by `index` first; the order isn't guaranteed.
- **A made-up citation survives** — only keep ids that are in `retrieved`, and remove the others from the text, not just from `sources`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
