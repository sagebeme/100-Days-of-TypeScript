// Where the words go on a meme. Text is measured through a function you're given, so the page can
// use the real canvas and the tests a predictable fake. The tests are the spec.
export type Measure = (text: string, fontSize: number) => number; // the width, in pixels

export interface Box {
  width: number;
  height: number;
}

export interface Fit {
  fontSize: number;
  lines: string[];
  lineHeight: number;
}

export interface Caption {
  text: string;
  position: "top" | "bottom";
}

export interface PlacedCaption extends Fit {
  x: number; // the centre of each line
  y: number[]; // the baseline of each line
}

export function wrapText(text: string, maxWidth: number, fontSize: number, measure: Measure): string[] {
  throw new Error(`TODO: wrapText(${text}, ${maxWidth}, ${fontSize}, ${typeof measure})`);
}

export function fitText(text: string, box: Box, measure: Measure, options: { min?: number; max?: number; lineSpacing?: number } = {}): Fit {
  throw new Error(`TODO: fitText(${text}, ${box.width}, ${typeof measure}, ${JSON.stringify(options)})`);
}

export function layoutMeme(image: Box, captions: Caption[], measure: Measure, uppercase = true): PlacedCaption[] {
  throw new Error(`TODO: layoutMeme(${image.width}, ${captions.length}, ${typeof measure}, ${uppercase})`);
}

export function fileName(captions: Caption[]): string {
  throw new Error(`TODO: fileName(${captions.length})`);
}
