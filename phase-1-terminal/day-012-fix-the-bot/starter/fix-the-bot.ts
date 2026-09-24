export type BotReply = {
  message: string;
  mood: "happy" | "neutral" | "annoyed";
};

// This function is broken on purpose. It has two bugs: find and fix both.
export function craftReply(userMessage: string, repeatCount: number): BotReply {
  let reply = "";
  for (let i = 0; i <= repeatCount; i++) {
    reply += userMessage;
  }

  const mood = repeatCount > 3 ? "annoyed" : "happy";

  return { message: reply, mod: mood };
}
