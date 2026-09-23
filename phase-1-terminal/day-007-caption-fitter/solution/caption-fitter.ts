export function smsParts(text: string): number {
  if (text.length <= 160) {
    return 1;
  }
  return Math.ceil(text.length / 153);
}

export function fitsInXPost(text: string): boolean {
  return text.length <= 280;
}
