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
  // TODO: objects and arrays: a copy where every key that isSecret(key) has the value "[redacted]",
  //   going into nested objects and arrays (stop after 5 levels). Anything else: returned as it is.
  void isSecret;
  return value;
}

export function createLogger(options: { level: Level; write?: (line: string) => void; now?: () => Date; base?: Fields }): Logger {
  // TODO: write defaults to one line on stdout; now defaults to new Date()
  // TODO: log(level, msg, fields): skip levels below options.level (see ORDER), then write ONE line of JSON:
  //   { time, level, msg, ...redacted(base + fields) }, and if fields.error is an Error, an `error` object
  //   with its name, message and stack
  // TODO: return debug / info / warn / error, and child(fields): a logger whose base has those fields added
  void ORDER;
  throw new Error("not implemented yet");
}
