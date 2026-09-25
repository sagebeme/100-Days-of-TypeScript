// Already written: what does that $120 pair of sneakers really cost?
//   node phase-4-internet/day-045-real-cost/starter/cli.ts 120 35
import { join } from "node:path";
import { loadConfig, redact } from "./config.ts";
import { createRatesClient } from "./rates.ts";
import { landedCost, formatCost, EXAMPLE_RULES } from "./cost.ts";

try {
  // Node 24 reads a .env file into process.env: no library needed.
  process.loadEnvFile(join(import.meta.dirname, ".env"));
} catch {
  console.error("No .env file yet. Copy .env.example to .env in this folder, then run this again.");
  process.exit(1);
}

try {
  const config = loadConfig(process.env);
  console.log(`Using rates from ${config.ratesApiUrl} with key ${redact(config.ratesApiKey)}\n`);

  const [item = "120", shipping = "35"] = process.argv.slice(2);
  const rate = await createRatesClient(config, fetch).kesPerDollar();
  console.log(`$1 = KES ${rate}\n`);
  console.log(formatCost(landedCost({ itemUsd: Number(item), shippingUsd: Number(shipping) }, rate, EXAMPLE_RULES)));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
