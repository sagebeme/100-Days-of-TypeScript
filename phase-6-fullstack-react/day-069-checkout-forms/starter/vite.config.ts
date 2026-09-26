import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { OrderRequestSchema, fieldErrors } from "./schemas.ts";
import { totalOf } from "./cart.ts";

// Already written: a pretend API, running inside the Vite dev server, so the form has something
// real to talk to. It checks orders with the SAME schema the form uses: that's the point of today.
//   0700 000 000 as the phone -> M-Pesa is "down" (502)
//   more than 6 tickets       -> "sold out" (409)
function fakeOrdersApi(): Plugin {
  let nextId = 1;
  return {
    name: "fake-orders-api",
    configureServer(server) {
      server.middlewares.use("/api/orders", async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (req.method !== "POST") return send(405, { error: "POST only" });
        let raw = "";
        for await (const chunk of req) raw += chunk;
        await new Promise((resolve) => setTimeout(resolve, 900)); // a slow network, so you can see the button change

        const parsed = OrderRequestSchema.safeParse(JSON.parse(raw || "null"));
        if (!parsed.success) return send(422, { errors: fieldErrors(parsed.error) });
        const order = parsed.data;
        if (order.phone === "254700000000") return send(502, { error: "M-Pesa didn't answer, so no money was taken. Try again in a minute." });
        const tickets = order.lines.reduce((n, line) => n + line.quantity, 0);
        if (tickets > 6) return send(409, { error: "Only 6 tickets are left. Change your order and try again." });
        return send(201, { order: { id: nextId++, totalKes: totalOf(order.lines), phone: order.phone } });
      });
    },
  };
}

export default defineConfig({ plugins: [react(), fakeOrdersApi()] });
