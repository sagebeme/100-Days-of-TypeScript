import { ApiError, tikitiClient, Unreachable, type Order } from "./api.ts";
import { parseCommand, UsageError, type Command } from "./args.ts";
import { kes, painter, shouldColor, table, when, type Paint } from "./format.ts";
import { USAGE, VERSION, type Io } from "./io.ts";
import { waitForOrder } from "./poll.ts";
import { clearSession, configDir, loadSession, saveSession, sessionCookie, type Session } from "./session.ts";

// Exit codes: 0 done, 1 it didn't work, 2 the command itself was wrong.
export const OK = 0;
export const FAILED = 1;
export const USAGE_ERROR = 2;

export const POLL_INTERVAL_MS = 2_000;
export const POLL_TIMEOUT_MS = 120_000;

class NotLoggedIn extends Error {}

export async function run(io: Io): Promise<number> {
  const paint = painter(shouldColor(io.env, io.isTTY));
  const baseUrl = io.env.TIKITI_URL || "http://localhost:3066";
  const dir = configDir(io.env, io.home);
  const fail = (message: string) => {
    io.err(`${paint.red("✘")} ${message}\n`);
    return FAILED;
  };

  let command: Command;
  try {
    command = parseCommand(io.argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    io.err(`${error.message}\nRun "tikiti help" to see every command.\n`);
    return USAGE_ERROR;
  }

  const session = async (): Promise<Session> => {
    const saved = await loadSession(dir, baseUrl);
    if (!saved) throw new NotLoggedIn();
    return saved;
  };

  try {
    switch (command.name) {
      case "help":
        io.out(USAGE);
        return OK;
      case "version":
        io.out(`tikiti ${VERSION}\n`);
        return OK;
      case "login":
        return await login(command.email);
      case "logout":
        return await logout();
      case "events":
        return await events(command.json);
      case "buy": {
        const api = tikitiClient(baseUrl, io.fetch, (await session()).cookie);
        return await buy(api, command);
      }
      case "order": {
        const api = tikitiClient(baseUrl, io.fetch, (await session()).cookie);
        const order = await api.order(command.orderId);
        if (command.json) io.out(JSON.stringify(order, null, 2) + "\n");
        else io.out(describeOrder(order, paint));
        return OK;
      }
    }
  } catch (error) {
    if (error instanceof NotLoggedIn) return fail(`Log in first: tikiti login <email>`);
    if (error instanceof ApiError && error.status === 401 && command.name !== "login") {
      await clearSession(dir);
      return fail("Your session has expired. Log in again: tikiti login <email>");
    }
    if (error instanceof ApiError || error instanceof Unreachable) return fail(error.message);
    return fail(`Something went wrong: ${(error as Error).message}`);
  }

  async function login(email: string): Promise<number> {
    const password = io.env.TIKITI_PASSWORD ?? (await io.prompt("Password: ", { hidden: true }));
    if (!password) return fail("No password given.");
    const { body, setCookie } = await tikitiClient(baseUrl, io.fetch).login(email, password);
    const cookie = sessionCookie(setCookie);
    if (!cookie) return fail("Tikiti didn't send a session. Is TIKITI_URL the API, not the website?");
    await saveSession(dir, { baseUrl, cookie, name: body.user.name, email: body.user.email });
    io.out(`${paint.green("✔")} Logged in as ${paint.bold(body.user.name)} (${body.user.email}).\n`);
    return OK;
  }

  async function logout(): Promise<number> {
    const saved = await loadSession(dir, baseUrl);
    if (!saved) {
      io.out("You weren't logged in.\n");
      return OK;
    }
    // Forget it here even if the server can't be told: the file is what matters on this machine.
    await tikitiClient(baseUrl, io.fetch, saved.cookie)
      .logout()
      .catch(() => {});
    await clearSession(dir);
    io.out("Logged out.\n");
    return OK;
  }

  async function events(json: boolean): Promise<number> {
    const all = await tikitiClient(baseUrl, io.fetch).events();
    const upcoming = all.filter((e) => Date.parse(e.startsAt) > io.now());
    if (json) {
      io.out(JSON.stringify(upcoming, null, 2) + "\n");
      return OK;
    }
    if (upcoming.length === 0) {
      io.out("Nothing on sale right now.\n");
      return OK;
    }
    const seats = (n: number) => (n <= 0 ? paint.red("Sold out") : n <= 20 ? paint.yellow(`${n} left`) : `${n} left`);
    const rows = upcoming.map((e) => [String(e.id), e.title, when(e.startsAt), e.venue, kes(e.priceKes), seats(e.available)]);
    const columns = [
      { header: "ID", align: "right" as const },
      { header: "EVENT", shrink: true },
      { header: "WHEN" },
      { header: "VENUE", shrink: true },
      { header: "PRICE", align: "right" as const },
      { header: "SEATS", align: "right" as const },
    ];
    const lines = table(rows, columns, io.columns).split("\n");
    io.out([paint.dim(lines[0]), ...lines.slice(1)].join("\n") + `\n\nBuy with: tikiti buy <ID> --phone 07XXXXXXXX\n`);
    return OK;
  }

  async function buy(api: ReturnType<typeof tikitiClient>, command: Extract<Command, { name: "buy" }>): Promise<number> {
    const { order, message } = await api.buy(command.eventId, command.quantity, command.phone);
    const seats = order.quantity === 1 ? "1 seat" : `${order.quantity} seats`;
    io.out(`Order ${order.id}: ${seats} held, ${kes(order.amountKes)}.\n${paint.bold(message)} (${command.phone}).\n`);
    if (!command.wait) {
      io.out(`Check on it with: tikiti order ${order.id}\n`);
      return OK;
    }

    // The "Waiting…" line goes to stderr, and only for a person at a terminal, so stdout stays clean
    // for anyone piping the ticket codes somewhere.
    const clearLine = () => io.isTTY && io.err("\r\x1b[2K");
    const result = await waitForOrder(() => api.order(order.id), {
      intervalMs: POLL_INTERVAL_MS,
      timeoutMs: POLL_TIMEOUT_MS,
      sleep: io.sleep,
      now: io.now,
      onWait: (elapsed) => io.isTTY && io.err(`\r${paint.dim(`Waiting for M-Pesa… ${Math.round(elapsed / 1000)}s`)}`),
    });
    clearLine();
    if (result.timedOut || !result.order) {
      io.out(`M-Pesa hasn't answered yet. Check later with: tikiti order ${order.id}\n`);
      return FAILED;
    }
    io.out(describeOrder(result.order, paint));
    return result.order.status === "paid" ? OK : FAILED;
  }

  return OK;
}

export function describeOrder(order: Order, paint: Paint): string {
  const tickets = order.quantity === 1 ? "1 ticket" : `${order.quantity} tickets`;
  const lines: string[] = [];
  switch (order.status) {
    case "paid":
      lines.push(`${paint.green("✔")} Order ${order.id} is paid: ${tickets}, ${kes(order.amountKes)}.${order.receipt ? ` M-Pesa receipt ${order.receipt}.` : ""}`);
      lines.push("", paint.bold("Your tickets"));
      for (const ticket of order.tickets) {
        lines.push(`  ${ticket.code}${ticket.checkedInAt ? paint.dim(`  used ${when(ticket.checkedInAt)}`) : ""}`);
      }
      lines.push("", paint.dim("Show a code at the gate. Staff can type it in if the QR won't scan."));
      break;
    case "pending":
      lines.push(`Order ${order.id} is waiting for M-Pesa: ${tickets}, ${kes(order.amountKes)}. Seats held until ${when(order.holdExpiresAt)}.`);
      break;
    case "expired":
      lines.push(`${paint.red("✘")} Order ${order.id} ran out before M-Pesa confirmed it. The seats are back on sale, and no money was taken.`);
      break;
    case "failed":
    case "cancelled":
      lines.push(`${paint.red("✘")} Order ${order.id} wasn't paid: ${order.problem ?? "the payment didn't go through"}.`);
      break;
  }
  return lines.join("\n") + "\n";
}
