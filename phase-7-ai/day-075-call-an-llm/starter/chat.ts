// Already written: talk to the concierge in your terminal, for real. It needs an API key:
//   export ANTHROPIC_API_KEY=sk-ant-...        (or `ant auth login`)
//   node phase-7-ai/day-075-call-an-llm/starter/chat.ts
// Every message costs a little money: the cost of each answer is shown after it.
import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "node:readline/promises";
import { Conversation, costKes, explainError } from "./concierge.ts";

const conversation = new Conversation(new Anthropic());
const terminal = createInterface({ input: process.stdin, output: process.stdout });
console.log("Tikiti concierge. Ask about tickets, M-Pesa or getting in. Ctrl+D to leave.\n");

let total = 0;
for await (const line of terminal) {
  if (!line.trim()) continue;
  try {
    process.stdout.write("\n");
    const answer = await conversation.send(line, (piece) => process.stdout.write(piece));
    if (answer.status !== "answered") process.stdout.write(answer.text);
    const cost = costKes(answer.usage);
    total += cost;
    console.log(`\n\n  (${answer.usage.input_tokens} in, ${answer.usage.output_tokens} out: KES ${cost.toFixed(2)}, KES ${total.toFixed(2)} so far)\n`);
  } catch (error) {
    console.log(explainError(error), "\n");
  }
}
