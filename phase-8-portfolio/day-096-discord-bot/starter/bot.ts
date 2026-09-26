import { type Interaction, type InteractionResponse } from "./discord.ts";
import type { Tikiti } from "./tikiti.ts";

// What the bot says to each interaction. The tests are the spec.
export interface BotOptions {
  tikiti: Tikiti;
  staffRoleId: string; // the server role allowed to check people in
  siteUrl: string; // where the "Buy tickets" buttons go
}

export const BRAND = 0xc2410c; // Tikiti's burnt orange

// "Sold out", "Only 12 left", "412 left"
export function seats(n: number): string {
  throw new Error(`TODO: seats(${n})`);
}

export async function handleInteraction(interaction: Interaction, options: BotOptions): Promise<InteractionResponse> {
  throw new Error(`TODO: handleInteraction(${interaction.type}, ${options.siteUrl})`);
}
