// The two ways a browser can share: the phone's share sheet, or the clipboard.
// `navigator` fits this shape, and so does a test fake.
export interface ShareTarget {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText(text: string): Promise<void> };
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export function shareText(score: number): string {
  // TODO: "I dodged 12 cars in Rider Rush. Can you beat me?" ("1 car" for one)
  throw new Error("not implemented yet");
}

// Try the share sheet first (phones), then the clipboard (most laptops).
export async function shareScore(score: number, url: string, target: ShareTarget): Promise<ShareResult> {
  // TODO: if target.share exists, await it with { title: "Rider Rush", text, url } -> "shared"
  //   if it throws an error named "AbortError", the player closed the sheet -> "cancelled"
  //   any other error: carry on to the clipboard
  // TODO: if target.clipboard exists, writeText(`${text} ${url}`) -> "copied" (if it throws, carry on)
  // TODO: otherwise -> "failed"
  throw new Error("not implemented yet");
}

export function shareMessage(result: ShareResult): string {
  // TODO: copied -> "Link copied. Paste it to your friends!"
  //       failed -> "Couldn't share from here. Copy the link from the address bar instead."
  //       shared / cancelled -> "" (the share sheet already told them what happened)
  throw new Error("not implemented yet");
}
