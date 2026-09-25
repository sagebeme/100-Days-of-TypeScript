export interface Palette {
  background: string;
  colors: string[];
}

export const PALETTES: Record<string, Palette> = {
  sunset: { background: "#fff3e0", colors: ["#e63946", "#f4a261", "#2a9d8f", "#264653"] },
  lake: { background: "#e0f2f1", colors: ["#006d77", "#83c5be", "#e29578", "#1d3557"] },
  savanna: { background: "#fefae0", colors: ["#bc6c25", "#dda15e", "#606c38", "#283618"] },
};
