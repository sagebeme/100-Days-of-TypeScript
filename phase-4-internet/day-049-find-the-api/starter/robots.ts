// robots.txt, following the standard (RFC 9309).

export interface Rule {
  allow: boolean;
  pattern: string; // "/private/", "/*.pdf$"
}

export interface Group {
  agents: string[]; // lowercased
  rules: Rule[];
  crawlDelay: number | null; // seconds; not in the standard, but widely used
}

export function parseRobots(text: string): Group[] {
  // TODO: go line by line. Drop comments (# to the end of the line) and blank lines.
  //   Each line is "key: value"; keys ignore case.
  //   User-agent: starts a new group, unless the line before was also a User-agent (then it joins that group).
  //               Store agents lowercased.
  //   Allow / Disallow: add a rule to the current group. An empty value means nothing: skip it.
  //   Crawl-delay: a number of seconds for the current group.
  //   Lines before the first User-agent belong to no group: skip them.
  throw new Error("not implemented yet");
}

// "*" matches anything; "$" at the end means "and nothing after".
export function matches(pattern: string, path: string): boolean {
  // TODO: the pattern matches the START of the path. "*" matches any characters.
  //   A "$" at the very end means the path must end there too.
  //   Tip: escape the pattern's other regex characters, turn each "*" into ".*", and build a RegExp.
  throw new Error("not implemented yet");
}

// "FitCheckBot/1.0 (+https://…)" -> "fitcheckbot"
export function productToken(userAgent: string): string {
  // TODO: the first word of the user agent, before any "/" or space, lowercased
  throw new Error("not implemented yet");
}

// TODO: groupsFor(groups, userAgent): the groups that name this bot's product token,
//   or, if none do, the "*" groups

export function isAllowed(groups: Group[], userAgent: string, path: string): boolean {
  // TODO: "/robots.txt" is always allowed.
  // TODO: of all the rules in this bot's groups that match the path, the longest pattern wins;
  //   if two are equally long, Allow wins. No matching rule means allowed.
  throw new Error("not implemented yet");
}

export function crawlDelay(groups: Group[], userAgent: string): number | null {
  // TODO: the biggest Crawl-delay in this bot's groups, or null if none sets one
  throw new Error("not implemented yet");
}
