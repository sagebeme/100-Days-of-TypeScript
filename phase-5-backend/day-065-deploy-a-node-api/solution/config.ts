import { z } from "zod";

// One app, three places it runs. Everything that differs between them comes from the environment,
// never from `if (production)` scattered through the code.
export type Environment = "development" | "test" | "production";

export interface Config {
  env: Environment;
  port: number;
  databasePath: string;
  logLevel: "debug" | "info" | "warn" | "error";
  sessionSecret: string;
  trustProxy: boolean;
  corsOrigin: string;
}

const DEV_SECRET = "dev-only-secret-not-for-production!!";

const Schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_PATH: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  SESSION_SECRET: z.string().optional(),
  TRUST_PROXY: z.enum(["true", "false"]).optional(),
  CORS_ORIGIN: z.url().optional(),
});

export function loadConfig(env: Record<string, string | undefined>): Config {
  const parsed = Schema.safeParse(env);
  const problems = parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  if (!parsed.success) throw new Error(`Bad configuration:\n  ${problems.join("\n  ")}`);
  const e = parsed.data;
  const production = e.NODE_ENV === "production";

  // Development gets friendly defaults. Production gets none: a missing setting there is a mistake,
  // and it's far better to refuse to start than to run with a guessable secret.
  if (production) {
    if (!e.SESSION_SECRET || e.SESSION_SECRET.length < 32) problems.push("SESSION_SECRET: set a random secret of at least 32 characters");
    if (e.SESSION_SECRET === DEV_SECRET) problems.push("SESSION_SECRET: that's the development secret");
    if (!e.DATABASE_PATH) problems.push("DATABASE_PATH: say where the database file lives (on a persistent disk)");
    if (!e.CORS_ORIGIN?.startsWith("https://")) problems.push("CORS_ORIGIN: set your website's https:// address");
  }
  if (problems.length > 0) throw new Error(`Bad configuration:\n  ${problems.join("\n  ")}`);

  return {
    env: e.NODE_ENV,
    port: e.PORT,
    databasePath: e.DATABASE_PATH ?? (e.NODE_ENV === "test" ? ":memory:" : "./dev.db"),
    logLevel: e.LOG_LEVEL ?? (production ? "info" : e.NODE_ENV === "test" ? "warn" : "debug"),
    sessionSecret: e.SESSION_SECRET ?? DEV_SECRET,
    trustProxy: e.TRUST_PROXY === undefined ? production : e.TRUST_PROXY === "true", // hosts put a proxy in front of you
    corsOrigin: e.CORS_ORIGIN ?? "http://localhost:5173",
  };
}
