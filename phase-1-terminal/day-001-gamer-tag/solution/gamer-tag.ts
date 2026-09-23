export function buildGamerTag(name: string, favoriteNumber: number): string {
  const prefix = "xX_";
  const suffix = "_Xx";

  let tag = `${name}${favoriteNumber}`;
  tag = `${prefix}${tag}${suffix}`;

  return tag;
}
