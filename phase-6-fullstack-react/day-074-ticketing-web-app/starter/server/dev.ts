import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { orders } from "./schema.ts";
import { parseCallback } from "./callback.ts";
import { settlePayment } from "./orders.ts";
import { mpesaCallback } from "./mpesa-sandbox.ts";
import { requireUser, type Env } from "./guards.ts";
import { idParam, fail } from "./http.ts";
import type { Database } from "./db.ts";

// Already written: the M-Pesa sandbox, for development only. Without real Daraja keys nobody's phone
// gets a prompt, so the order page shows "Pay" and "Cancel" buttons that send what Safaricom would.
// It's never mounted in production (see context.ts).
export function devRoutes(database: Database, now: () => Date) {
  const app = new Hono<Env>();
  app.post("/dev/orders/:id/settle", requireUser, async (c) => {
    const order = await database.db.query.orders.findFirst({ where: eq(orders.id, idParam(c)) });
    if (!order || order.userId !== c.get("user").id || !order.checkoutRequestId) fail(404, "No such order");
    const { outcome } = (await c.req.json().catch(() => ({}))) as { outcome?: "paid" | "cancelled" };
    const body = mpesaCallback(order.checkoutRequestId, order.amountKes, outcome === "cancelled" ? "cancelled" : "paid");
    const settled = await settlePayment(database, parseCallback(body), now());
    return c.json({ result: settled.result });
  });
  return app;
}
