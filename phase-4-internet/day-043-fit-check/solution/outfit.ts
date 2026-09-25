import { describeSky, type Today } from "./weather.ts";

export interface Outfit {
  top: string;
  bottom: string;
  extras: string[];
}

export function pickOutfit(today: Today): Outfit {
  const feels = today.feelsLike;
  const wet = today.rainNow > 0 || today.rainChance >= 60;

  let top: string;
  if (feels < 14) top = "Hoodie or a warm jacket";
  else if (feels < 20) top = "Light sweater or a denim jacket";
  else if (feels < 27) top = "T-shirt";
  else top = "Vest or a light tee";

  const bottom = feels >= 24 && !wet && today.rainChance < 40 ? "Shorts" : "Jeans or chinos";

  const extras: string[] = [];
  if (wet) {
    extras.push("Umbrella", "Skip the white sneakers");
  } else if (today.rainChance >= 30) {
    extras.push("Pack a small umbrella");
  }
  if (today.windKmh >= 30) extras.push("Windbreaker");
  if (today.high - today.low >= 10) extras.push("Layers: it's cold early and warm later");
  if (today.code === 0 && today.high >= 25) extras.push("Sunglasses");

  return { top, bottom, extras };
}

export function formatReport(placeName: string, today: Today, outfit: Outfit): string {
  const lines = [
    `Fit check for ${placeName}`,
    `${describeSky(today.code)}, ${Math.round(today.temperature)}°C (feels like ${Math.round(today.feelsLike)}°C)`,
    `High ${Math.round(today.high)}°C, low ${Math.round(today.low)}°C, ${today.rainChance}% chance of rain`,
    "",
    `Top:    ${outfit.top}`,
    `Bottom: ${outfit.bottom}`,
  ];
  if (outfit.extras.length > 0) {
    lines.push(`Also:   ${outfit.extras.join(", ")}`);
  }
  return lines.join("\n");
}
