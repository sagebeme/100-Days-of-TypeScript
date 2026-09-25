import { describeSky, type Today } from "./weather.ts";

export interface Outfit {
  top: string;
  bottom: string;
  extras: string[];
}

export function pickOutfit(today: Today): Outfit {
  // TODO: see the table in the README. `wet` means it's raining now or rainChance is 60% or more.
  throw new Error("not implemented yet");
}

export function formatReport(placeName: string, today: Today, outfit: Outfit): string {
  // TODO: the lines shown in the README, joined with "\n". Round the temperatures.
  //       Leave out the "Also:" line when there are no extras.
  throw new Error("not implemented yet");
}
