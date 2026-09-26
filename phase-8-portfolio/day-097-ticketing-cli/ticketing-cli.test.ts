import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, stat, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closest, parseCommand, normalisePhone, UsageError } from "./starter/args.ts";
import { kes, shouldColor, table, visibleWidth, when } from "./starter/format.ts";
import { clearSession, configDir, loadSession, saveSession, sessionCookie } from "./starter/session.ts";
import { waitForOrder } from "./starter/poll.ts";
import { run } from "./starter/run.ts";
import { ApiError, Unreachable, type EventSummary, type Order } from "./starter/api.ts";
import type { Io } from "./starter/io.ts";

const usage = (argv: string[]) => {
  try {
    parseCommand(argv);
  } catch (error) {
    if (error instanceof UsageError) return error.message;
    throw error;
  }
  throw new Error(`expected a usage error for ${argv.join(" ")}`);
};

describe("reading the command line", () => {
  it("understands every command", () => {
    expect(parseCommand([])).toEqual({ name: "help" });
    expect(parseCommand(["--help"])).toEqual({ name: "help" });
    expect(parseCommand(["-v"])).toEqual({ name: "version" });
    expect(parseCommand(["login", "amina@example.com"])).toEqual({ name: "login", email: "amina@example.com" });
    expect(parseCommand(["logout"])).toEqual({ name: "logout" });
    expect(parseCommand(["events"])).toEqual({ name: "events", json: false });
    expect(parseCommand(["events", "--json"])).toEqual({ name: "events", json: true });
    expect(parseCommand(["order", "12", "--json"])).toEqual({ name: "order", orderId: 12, json: true });
  });

  it("reads buy's options in any order, long or short, with sensible defaults", () => {
    expect(parseCommand(["buy", "7", "--phone", "0712 345 678"])).toEqual({ name: "buy", eventId: 7, quantity: 1, phone: "0712345678", wait: true });
    expect(parseCommand(["buy", "-q", "3", "7", "-p", "+254712345678", "--no-wait"])).toEqual({ name: "buy", eventId: 7, quantity: 3, phone: "0712345678", wait: false });
    expect(parseCommand(["buy", "7", "--quantity=2", "--phone=0112345678"])).toMatchObject({ quantity: 2, phone: "0112345678" });
  });

  it("tidies M-Pesa numbers written the ways Kenyans write them", () => {
    expect(["0712345678", "0712 345 678", "+254 712 345 678", "254712345678", "0712-345-678"].map(normalisePhone)).toEqual(Array(5).fill("0712345678"));
    expect(["0612345678", "071234567", "+1 712 345 6789", "phone"].map(normalisePhone)).toEqual([null, null, null, null]);
  });

  it("says exactly what's wrong with buy, and how to fix it", () => {
    expect(usage(["buy"])).toBe('tikiti buy: say which event, like "tikiti buy 12"');
    expect(usage(["buy", "jazz", "--phone", "0712345678"])).toBe('tikiti buy: "jazz" isn\'t a event number');
    expect(usage(["buy", "7"])).toBe("tikiti buy: say which phone M-Pesa should ask, like --phone 0712345678");
    expect(usage(["buy", "7", "--phone", "12345"])).toBe('tikiti buy: "12345" isn\'t an M-Pesa number. Try 07XXXXXXXX');
    for (const q of ["0", "11", "two", "1.5"]) expect(usage(["buy", "7", "-q", q, "--phone", "0712345678"])).toBe("tikiti buy: --quantity must be a whole number from 1 to 10");
  });

  it("rejects options and extra words a command doesn't take", () => {
    expect(usage(["events", "--jsn"])).toMatch(/^tikiti events: Unknown option '--jsn'/);
    expect(usage(["logout", "now"])).toBe('tikiti logout: didn\'t expect "now"');
    expect(usage(["login"])).toBe('tikiti login: give your email, like "tikiti login amina@example.com"');
    expect(usage(["login", "amina"])).toBe('tikiti login: give your email, like "tikiti login amina@example.com"');
    expect(usage(["order", "0"])).toBe('tikiti order: "0" isn\'t a order number');
  });

  it("suggests the command you probably meant, but only when it's close", () => {
    expect(usage(["evnts"])).toBe('Unknown command "evnts". Did you mean "events"?');
    expect(usage(["BUY"])).toBe('Unknown command "BUY". Did you mean "buy"?');
    expect(usage(["refund"])).toBe('Unknown command "refund".');
    expect(closest("logn", ["login", "logout"])).toBe("login");
  });
});

describe("output for people", () => {
  it("colours only for a person at a terminal, following NO_COLOR and FORCE_COLOR", () => {
    expect(shouldColor({}, true)).toBe(true);
    expect(shouldColor({}, false)).toBe(false);
    expect(shouldColor({ NO_COLOR: "1" }, true)).toBe(false);
    expect(shouldColor({ NO_COLOR: "" }, true)).toBe(true); // set but empty doesn't count
    expect(shouldColor({ FORCE_COLOR: "1" }, false)).toBe(true);
    expect(shouldColor({ FORCE_COLOR: "0" }, true)).toBe(false);
    expect(shouldColor({ TERM: "dumb" }, true)).toBe(false);
    expect(shouldColor({ NO_COLOR: "1", FORCE_COLOR: "1" }, true)).toBe(false);
  });

  it("measures text as it looks: colour codes take no room", () => {
    expect(visibleWidth("\x1b[31mSold out\x1b[39m")).toBe(8);
    expect(visibleWidth("Jioni 🎷")).toBe(7);
  });

  it("lines up a table, right-aligning numbers, with no trailing spaces", () => {
    const text = table(
      [
        ["1", "Jioni Jazz Night", "KES 1,000"],
        ["12", "Sauti", "KES 800"],
      ],
      [{ header: "ID", align: "right" }, { header: "EVENT" }, { header: "PRICE", align: "right" }],
      80,
    );
    expect(text).toBe(["ID  EVENT                 PRICE", " 1  Jioni Jazz Night  KES 1,000", "12  Sauti               KES 800"].join("\n"));
  });

  it("fits a narrow terminal by cutting the columns that can shrink", () => {
    const rows = [["1", "The Very Long Name Of A Festival", "Uhuru Gardens, Nairobi", "KES 1,000"]];
    const text = table(rows, [{ header: "ID" }, { header: "EVENT", shrink: true }, { header: "VENUE", shrink: true }, { header: "PRICE" }], 50);
    for (const line of text.split("\n")) expect(visibleWidth(line)).toBeLessThanOrEqual(50);
    expect(text).toContain("…");
    expect(text).toContain("KES 1,000"); // the columns that don't shrink stay whole
  });

  it("writes money and dates the way people here read them", () => {
    expect(kes(1500)).toBe("KES 1,500");
    expect(when("2026-12-12T15:00:00Z")).toBe("Sat 12 Dec 2026, 18:00");
  });
});

describe("staying logged in", () => {
  let home: string;
  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "tikiti-"));
  });
  afterEach(() => rm(home, { recursive: true, force: true }));

  it("keeps its file where config belongs", () => {
    expect(configDir({}, "/home/amina")).toBe("/home/amina/.config/tikiti");
    expect(configDir({ XDG_CONFIG_HOME: "/cfg" }, "/home/amina")).toBe("/cfg/tikiti");
  });

  it("keeps just the cookie to send back", () => {
    expect(sessionCookie("session=abc123; Path=/; HttpOnly; SameSite=Lax")).toBe("session=abc123");
    expect(sessionCookie("theme=dark; Path=/, session=xyz; Expires=Wed, 09 Dec 2026 10:00:00 GMT; HttpOnly")).toBe("session=xyz");
    expect(sessionCookie("theme=dark")).toBeNull();
    expect(sessionCookie(null)).toBeNull();
  });

  it("saves the session so only you can read it, and loads it back", async () => {
    const dir = configDir({}, home);
    const session = { baseUrl: "http://localhost:3066", cookie: "session=abc", name: "Amina", email: "amina@example.com" };
    await saveSession(dir, session);
    expect((await stat(join(dir, "session.json"))).mode & 0o777).toBe(0o600);
    expect(await loadSession(dir, "http://localhost:3066")).toEqual(session);
  });

  it("never sends one server's cookie to another", async () => {
    const dir = configDir({}, home);
    await saveSession(dir, { baseUrl: "http://localhost:3066", cookie: "session=abc", name: "A", email: "a@example.com" });
    expect(await loadSession(dir, "https://tikiti.example")).toBeNull();
  });

  it("treats a missing or mangled file as logged out, and can forget", async () => {
    const dir = configDir({}, home);
    expect(await loadSession(dir, "x")).toBeNull();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "session.json"), "{not json");
    expect(await loadSession(dir, "x")).toBeNull();
    await clearSession(dir);
    await clearSession(dir); // twice is fine
    await expect(stat(join(dir, "session.json"))).rejects.toThrow();
  });
});

const order = (status: Order["status"], extra: Partial<Order> = {}): Order => ({
  id: 12,
  eventId: 1,
  quantity: 2,
  amountKes: 2000,
  status,
  holdExpiresAt: "2026-12-01T09:10:00Z",
  receipt: null,
  problem: null,
  tickets: [],
  ...extra,
});

function clock() {
  let t = 0;
  const slept: number[] = [];
  return { now: () => t, sleep: async (ms: number) => void (slept.push(ms), (t += ms)), slept };
}

describe("waiting for M-Pesa", () => {
  it("asks until the order isn't pending any more", async () => {
    const answers = [order("pending"), order("pending"), order("paid")];
    const c = clock();
    const waits: number[] = [];
    const result = await waitForOrder(async () => answers.shift()!, { intervalMs: 2000, timeoutMs: 60_000, ...c, onWait: (ms) => void waits.push(ms) });
    expect(result).toEqual({ order: order("paid"), timedOut: false });
    expect(c.slept).toEqual([2000, 2000]);
    expect(waits).toEqual([0, 2000]);
  });

  it("gives up at the timeout, with the last answer it had", async () => {
    const c = clock();
    const result = await waitForOrder(async () => order("pending"), { intervalMs: 2000, timeoutMs: 7000, ...c });
    expect(result).toEqual({ order: order("pending"), timedOut: true });
    expect(c.slept.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(7000);
  });

  it("rides out a network blip or two, but not three in a row", async () => {
    const blip = () => new Unreachable("offline");
    const flaky = [blip(), blip(), order("pending"), blip(), order("paid")];
    const c = clock();
    const next = async () => {
      const item = flaky.shift()!;
      if (item instanceof Error) throw item;
      return item;
    };
    expect((await waitForOrder(next, { intervalMs: 1000, timeoutMs: 60_000, ...c })).order?.status).toBe("paid");
    const down = [blip(), blip(), blip()];
    await expect(
      waitForOrder(
        async () => {
          throw down.shift()!;
        },
        { intervalMs: 1000, timeoutMs: 60_000, ...clock() },
      ),
    ).rejects.toThrow("offline");
  });

  it("stops at once on a real error from the API", async () => {
    await expect(
      waitForOrder(
        async () => {
          throw new ApiError(404, "No such order");
        },
        { intervalMs: 1000, timeoutMs: 60_000, ...clock() },
      ),
    ).rejects.toThrow("No such order");
  });
});

// A pretend Day 66 API.
const NOW = Date.parse("2026-12-01T09:00:00Z");
const EVENTS: EventSummary[] = [
  { id: 9, title: "Last Month's Show", venue: "Alliance Française", startsAt: "2026-11-01T18:00:00+03:00", priceKes: 500, available: 10 },
  { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 1000, available: 412 },
  { id: 2, title: "Sauti za Pwani", venue: "Fort Jesus, Mombasa", startsAt: "2026-12-19T16:00:00+03:00", priceKes: 1500, available: 12 },
  { id: 3, title: "Nairobi Comedy Store", venue: "Kenya National Theatre", startsAt: "2026-12-20T19:30:00+03:00", priceKes: 800, available: 0 },
];

function fakeApi(options: { pendingPolls?: number; outcome?: Order["status"]; down?: boolean } = {}) {
  const requests: string[] = [];
  let polls = 0;
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
  const fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (options.down) throw new TypeError("fetch failed");
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const cookie = new Headers(init?.headers).get("cookie");
    requests.push(`${method} ${url.pathname}`);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (method === "POST" && url.pathname === "/login") {
      if (body.password !== "chapati-rainbow-7") return json(401, { error: "Email or password is wrong" });
      return json(200, { user: { id: 5, name: "Amina", email: body.email, role: "fan" } }, { "Set-Cookie": "session=tok-123; Path=/; HttpOnly; SameSite=Lax" });
    }
    if (method === "POST" && url.pathname === "/logout") return json(200, { ok: true });
    if (method === "GET" && url.pathname === "/events") return json(200, { events: EVENTS });
    if (cookie !== "session=tok-123") return json(401, { error: "Log in first" });
    if (method === "POST" && url.pathname === "/events/3/orders") return json(409, { error: "Sold out" });
    if (method === "POST" && /^\/events\/\d+\/orders$/.test(url.pathname)) {
      return json(201, { order: order("pending", { quantity: body.quantity, amountKes: 1000 * body.quantity }), message: "Check your phone and enter your M-Pesa PIN" });
    }
    if (method === "GET" && url.pathname === "/orders/12") {
      if (polls++ < (options.pendingPolls ?? 0)) return json(200, { order: order("pending") });
      const outcome = options.outcome ?? "paid";
      return json(200, {
        order:
          outcome === "paid"
            ? order("paid", { receipt: "QKX12ABC34", tickets: [{ id: 1, code: "T1-3419C1CF5A2891AA", checkedInAt: null }, { id: 2, code: "T2-055C33999142F9B6", checkedInAt: null }] })
            : order(outcome, { problem: outcome === "cancelled" ? "You cancelled the M-Pesa prompt" : null }),
      });
    }
    return json(404, { error: "Not found" });
  };
  return { fetch, requests };
}

describe("the whole CLI", () => {
  let home: string;
  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "tikiti-"));
  });
  afterEach(() => rm(home, { recursive: true, force: true }));

  function cli(argv: string[], api = fakeApi(), extra: Partial<Io> = {}) {
    const out: string[] = [];
    const err: string[] = [];
    const c = clock();
    const prompts: string[] = [];
    const io: Io = {
      argv,
      env: {},
      home,
      fetch: api.fetch,
      out: (t) => void out.push(t),
      err: (t) => void err.push(t),
      isTTY: false,
      columns: 100,
      prompt: async (question, { hidden }) => (prompts.push(`${question.trim()}${hidden ? " (hidden)" : ""}`), "chapati-rainbow-7"),
      sleep: c.sleep,
      now: () => NOW + c.now(),
      ...extra,
    };
    return run(io).then((code) => ({ code, out: out.join(""), err: err.join(""), prompts, slept: c.slept }));
  }
  const loggedIn = () => cli(["login", "amina@example.com"]);

  it("prints help, and exits 2 with a hint for a wrong command, keeping stdout clean", async () => {
    expect((await cli(["help"])).out).toContain("tikiti buy <event>");
    const wrong = await cli(["evnts"]);
    expect(wrong).toMatchObject({ code: 2, out: "" });
    expect(wrong.err).toBe('Unknown command "evnts". Did you mean "events"?\nRun "tikiti help" to see every command.\n');
  });

  it("lists upcoming events as a table, without colour codes when piped", async () => {
    const { code, out } = await cli(["events"]);
    expect(code).toBe(0);
    expect(out).not.toContain("\x1b[");
    expect(out).not.toContain("Last Month's Show");
    const lines = out.split("\n");
    expect(lines[0]).toMatch(/^ID\s+EVENT\s+WHEN\s+VENUE\s+PRICE\s+SEATS$/);
    expect(lines[1]).toMatch(/^ 1\s+Jioni Jazz Night\s+Sat 12 Dec 2026, 18:00\s+Uhuru Gardens\s+KES 1,000\s+412 left$/);
    expect(lines[3]).toMatch(/Sold out$/);
  });

  it("gives scripts JSON with --json", async () => {
    const { out } = await cli(["events", "--json"]);
    expect(JSON.parse(out).map((e: EventSummary) => e.id)).toEqual([1, 2, 3]);
  });

  it("colours for a person at a terminal", async () => {
    const { out } = await cli(["events"], fakeApi(), { isTTY: true });
    expect(out).toContain("\x1b[31mSold out\x1b[39m");
    expect(out).toContain("\x1b[33m12 left\x1b[39m");
  });

  it("logs in with a hidden password prompt, and remembers", async () => {
    const { code, out, prompts } = await loggedIn();
    expect(code).toBe(0);
    expect(prompts).toEqual(["Password: (hidden)"]);
    expect(out).toBe("✔ Logged in as Amina (amina@example.com).\n");
    expect(JSON.parse(await readFile(join(home, ".config/tikiti/session.json"), "utf8"))).toMatchObject({ cookie: "session=tok-123", name: "Amina" });
  });

  it("takes the password from TIKITI_PASSWORD for scripts, and says when it's wrong", async () => {
    const scripted = await cli(["login", "amina@example.com"], fakeApi(), { env: { TIKITI_PASSWORD: "chapati-rainbow-7" } });
    expect(scripted).toMatchObject({ code: 0, prompts: [] });
    const wrong = await cli(["login", "amina@example.com"], fakeApi(), { env: { TIKITI_PASSWORD: "nope" } });
    expect(wrong).toMatchObject({ code: 1, err: "✘ Email or password is wrong\n" });
  });

  it("won't buy before you log in", async () => {
    expect(await cli(["buy", "1", "--phone", "0712345678"])).toMatchObject({ code: 1, err: "✘ Log in first: tikiti login <email>\n" });
  });

  it("buys, waits for M-Pesa, and prints the ticket codes", async () => {
    await loggedIn();
    const api = fakeApi({ pendingPolls: 2 });
    const { code, out, err, slept } = await cli(["buy", "1", "-q", "2", "--phone", "0712 345 678"], api);
    expect(code).toBe(0);
    expect(err).toBe(""); // no "Waiting…" line when nobody's watching
    expect(slept).toEqual([2000, 2000]);
    expect(api.requests).toEqual(["POST /events/1/orders", "GET /orders/12", "GET /orders/12", "GET /orders/12"]);
    expect(out).toContain("Order 12: 2 seats held, KES 2,000.\nCheck your phone and enter your M-Pesa PIN (0712345678).");
    expect(out).toContain("✔ Order 12 is paid: 2 tickets, KES 2,000. M-Pesa receipt QKX12ABC34.");
    expect(out).toContain("  T1-3419C1CF5A2891AA\n  T2-055C33999142F9B6\n");
  });

  it("shows a live 'Waiting…' line on stderr, for a person at a terminal", async () => {
    await loggedIn();
    const { err } = await cli(["buy", "1", "--phone", "0712345678"], fakeApi({ pendingPolls: 2 }), { isTTY: true });
    expect(err).toContain("Waiting for M-Pesa… 2s");
    expect(err.endsWith("\r\x1b[2K")).toBe(true); // and clears it after
  });

  it("exits 1 when the payment doesn't go through, saying why", async () => {
    await loggedIn();
    const { code, out } = await cli(["buy", "1", "--phone", "0712345678"], fakeApi({ outcome: "cancelled" }));
    expect(code).toBe(1);
    expect(out).toContain("✘ Order 12 wasn't paid: You cancelled the M-Pesa prompt.");
    const expired = await cli(["buy", "1", "--phone", "0712345678"], fakeApi({ outcome: "expired" }));
    expect(expired.out).toContain("The seats are back on sale, and no money was taken.");
  });

  it("stops waiting after two minutes, and says how to check later", async () => {
    await loggedIn();
    const { code, out, slept } = await cli(["buy", "1", "--phone", "0712345678"], fakeApi({ pendingPolls: 1000 }));
    expect(code).toBe(1);
    expect(out).toContain("M-Pesa hasn't answered yet. Check later with: tikiti order 12");
    expect(slept.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(120_000);
  });

  it("doesn't wait with --no-wait", async () => {
    await loggedIn();
    const api = fakeApi();
    const { code, out } = await cli(["buy", "1", "--phone", "0712345678", "--no-wait"], api);
    expect(code).toBe(0);
    expect(out).toContain("Check on it with: tikiti order 12");
    expect(api.requests).toEqual(["POST /events/1/orders"]);
  });

  it("passes the API's own reason on: sold out", async () => {
    await loggedIn();
    expect(await cli(["buy", "3", "--phone", "0712345678"])).toMatchObject({ code: 1, err: "✘ Sold out\n" });
  });

  it("forgets an expired session and asks you to log in again", async () => {
    await saveSession(join(home, ".config/tikiti"), { baseUrl: "http://localhost:3066", cookie: "session=old", name: "Amina", email: "a@example.com" });
    const { code, err } = await cli(["order", "12"]);
    expect(code).toBe(1);
    expect(err).toBe("✘ Your session has expired. Log in again: tikiti login <email>\n");
    expect(await loadSession(join(home, ".config/tikiti"), "http://localhost:3066")).toBeNull();
  });

  it("says plainly when the API isn't there", async () => {
    const { code, err } = await cli(["events"], fakeApi({ down: true }));
    expect(code).toBe(1);
    expect(err).toBe("✘ Can't reach Tikiti at http://localhost:3066. Is it running?\n");
  });

  it("uses TIKITI_URL, and logs out", async () => {
    const other = await cli(["events"], fakeApi({ down: true }), { env: { TIKITI_URL: "https://api.tikiti.example" } });
    expect(other.err).toContain("https://api.tikiti.example");
    await loggedIn();
    expect((await cli(["logout"])).out).toBe("Logged out.\n");
    expect((await cli(["logout"])).out).toBe("You weren't logged in.\n");
  });
});
