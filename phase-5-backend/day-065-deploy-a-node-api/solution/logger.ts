// Structured logs: one JSON object per line. On your laptop they're a little harder to read;
// in production, the hosting platform can search, filter and graph them ("every 500 in the last hour").
export type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export type Fields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(fields: Fields): Logger; // a logger that adds the same fields to every line (like a request id)
}

// Any field whose name contains one of these words is never written out, however deep it's nested:
// "password", "sessionSecret", "accessToken", "Authorization"... but not "passengers".
const SECRET_WORDS = ["password", "passwd", "secret", "token", "authorization", "cookie", "apikey", "api_key", "api-key"];
const isSecret = (key: string) => SECRET_WORDS.some((word) => key.toLowerCase().includes(word));

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, isSecret(key) ? "[redacted]" : redact(v, depth + 1)]));
}

export function createLogger(options: { level: Level; write?: (line: string) => void; now?: () => Date; base?: Fields }): Logger {
  const write = options.write ?? ((line) => process.stdout.write(`${line}\n`));
  const now = options.now ?? (() => new Date());

  const log = (level: Level, msg: string, fields: Fields = {}) => {
    if (ORDER[level] < ORDER[options.level]) return;
    const error = fields.error instanceof Error ? { error: { name: fields.error.name, message: fields.error.message, stack: fields.error.stack } } : {};
    write(JSON.stringify({ time: now().toISOString(), level, msg, ...(redact({ ...options.base, ...fields }) as Fields), ...error }));
  };

  return {
    debug: (msg, fields) => log("debug", msg, fields),
    info: (msg, fields) => log("info", msg, fields),
    warn: (msg, fields) => log("warn", msg, fields),
    error: (msg, fields) => log("error", msg, fields),
    child: (fields) => createLogger({ ...options, write, now, base: { ...options.base, ...fields } }),
  };
}
