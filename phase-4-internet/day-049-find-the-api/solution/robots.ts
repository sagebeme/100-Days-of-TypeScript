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
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      // Several User-agent lines in a row share one group.
      if (!lastWasAgent || current === null) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }

    lastWasAgent = false;
    if (current === null) continue; // rules before any User-agent belong to nobody
    if ((key === "allow" || key === "disallow") && value !== "") {
      current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "crawl-delay" && Number.isFinite(Number(value))) {
      current.crawlDelay = Number(value);
    }
  }
  return groups;
}

// "*" matches anything; "$" at the end means "and nothing after".
export function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${regex}${anchored ? "$" : ""}`).test(path);
}

// "FitCheckBot/1.0 (+https://…)" -> "fitcheckbot"
export function productToken(userAgent: string): string {
  return userAgent.trim().split(/[\s/]/)[0].toLowerCase();
}

function groupsFor(groups: Group[], userAgent: string): Group[] {
  const token = productToken(userAgent);
  const mine = groups.filter((g) => g.agents.includes(token));
  return mine.length > 0 ? mine : groups.filter((g) => g.agents.includes("*"));
}

export function isAllowed(groups: Group[], userAgent: string, path: string): boolean {
  if (path === "/robots.txt") return true;
  let best: Rule | null = null;
  for (const rule of groupsFor(groups, userAgent).flatMap((g) => g.rules)) {
    if (!matches(rule.pattern, path)) continue;
    // The most specific (longest) rule wins. On a tie, Allow wins.
    if (
      best === null ||
      rule.pattern.length > best.pattern.length ||
      (rule.pattern.length === best.pattern.length && rule.allow)
    ) {
      best = rule;
    }
  }
  return best === null || best.allow;
}

export function crawlDelay(groups: Group[], userAgent: string): number | null {
  const delays = groupsFor(groups, userAgent)
    .map((g) => g.crawlDelay)
    .filter((d): d is number => d !== null);
  return delays.length > 0 ? Math.max(...delays) : null;
}
