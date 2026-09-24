export type BotReply = {
  message: string;
  mood: "happy" | "neutral" | "annoyed";
};

export function craftReply(userMessage: string, repeatCount: number): BotReply {
  let reply = "";
  for (let i = 0; i < repeatCount; i++) {
    reply += userMessage;
  }

  const mood = repeatCount > 3 ? "annoyed" : "happy";

  return { message: reply, mood };
}
