// Already written: chat with the agent, for real (needs an API key, see Day 75). It shows every tool
// call as it happens. Nothing is really bought: the store is in memory.
//   node phase-7-ai/day-077-agent-with-tools/starter/chat.ts
import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "node:readline/promises";
import { TicketAgent } from "./agent.ts";
import { createStore } from "./store.ts";

const agent = new TicketAgent(new Anthropic(), createStore());
const terminal = createInterface({ input: process.stdin, output: process.stdout });
console.log("Tikiti agent. Try: 'anything on this weekend?' Ctrl+D to leave.\n");
for await (const line of terminal) {
  if (!line.trim()) continue;
  const reply = await agent.send(line);
  for (const call of reply.toolCalls) console.log(`  → ${call.name} ${JSON.stringify(call.input)}`);
  console.log(`\n${reply.text}\n`);
}
