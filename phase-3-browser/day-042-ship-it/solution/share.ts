// The two ways a browser can share: the phone's share sheet, or the clipboard.
// `navigator` fits this shape, and so does a test fake.
export interface ShareTarget {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText(text: string): Promise<void> };
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export function shareText(score: number): string {
  const cars = score === 1 ? "1 car" : `${score} cars`;
  return `I dodged ${cars} in Rider Rush. Can you beat me?`;
}

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

// Try the share sheet first (phones), then the clipboard (most laptops).
export async function shareScore(score: number, url: string, target: ShareTarget): Promise<ShareResult> {
  const text = shareText(score);
  if (target.share) {
    try {
      await target.share({ title: "Rider Rush", text, url });
      return "shared";
    } catch (error) {
      // The player closed the share sheet. That's a choice, not a failure.
      if (isAbort(error)) return "cancelled";
    }
  }
  if (target.clipboard) {
    try {
      await target.clipboard.writeText(`${text} ${url}`);
      return "copied";
    } catch {
      // Fall through: clipboard access can be refused.
    }
  }
  return "failed";
}

export function shareMessage(result: ShareResult): string {
  switch (result) {
    case "copied":
      return "Link copied. Paste it to your friends!";
    case "failed":
      return "Couldn't share from here. Copy the link from the address bar instead.";
    case "shared":
    case "cancelled":
      return "";
  }
}
