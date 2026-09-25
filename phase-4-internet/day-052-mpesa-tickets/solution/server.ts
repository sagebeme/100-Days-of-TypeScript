import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { parseCallback } from "./callback.ts";
import type { Daraja } from "./daraja.ts";

export interface TicketEvent {
  id: string;
  title: string;
  priceKes: number;
}

export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";

export interface Order {
  id: string;
  eventId: string;
  quantity: number;
  totalKes: number;
  phone: string;
  status: OrderStatus;
  checkoutRequestId: string | null;
  receipt: string | null;
  note: string;
}

export interface PaymentServerOptions {
  daraja: Daraja;
  events: TicketEvent[];
  callbackSecret: string; // part of the callback path, so strangers can't post fake payments
  log?: (line: string) => void;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 100_000) throw new Error("Body too large");
  }
  return JSON.parse(body);
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

export function createPaymentServer(options: PaymentServerOptions): { server: Server; orders: Map<string, Order> } {
  const orders = new Map<string, Order>();
  const byCheckout = new Map<string, Order>();
  const log = options.log ?? (() => {});

  async function buy(eventId: string, request: IncomingMessage, response: ServerResponse): Promise<void> {
    const event = options.events.find((e) => e.id === eventId);
    if (!event) return send(response, 404, { error: "No such event" });

    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      return send(response, 400, { error: "Send JSON like { \"phone\": \"0712345678\", \"quantity\": 2 }" });
    }
    const { phone, quantity } = (body ?? {}) as { phone?: unknown; quantity?: unknown };
    if (typeof phone !== "string" || !Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 10) {
      return send(response, 400, { error: "Send a phone number and a quantity from 1 to 10" });
    }

    const order: Order = {
      id: randomUUID(),
      eventId,
      quantity: quantity as number,
      totalKes: event.priceKes * (quantity as number),
      phone,
      status: "pending",
      checkoutRequestId: null,
      receipt: null,
      note: "Waiting for you to enter your M-Pesa PIN.",
    };

    try {
      const started = await options.daraja.stkPush({
        phone,
        amount: order.totalKes,
        reference: `TIX${order.id.slice(0, 8).toUpperCase()}`.slice(0, 12),
        description: "Event tickets",
      });
      order.checkoutRequestId = started.checkoutRequestId;
      orders.set(order.id, order);
      byCheckout.set(started.checkoutRequestId, order);
      log(`Order ${order.id}: STK push sent for KES ${order.totalKes}`);
      send(response, 202, { orderId: order.id, status: order.status, message: started.customerMessage });
    } catch (error) {
      send(response, 502, { error: error instanceof Error ? error.message : "M-Pesa is unavailable" });
    }
  }

  async function callback(request: IncomingMessage, response: ServerResponse): Promise<void> {
    // Always tell Safaricom "accepted", even when we ignore the message, or it keeps retrying.
    const accepted = () => send(response, 200, { ResultCode: 0, ResultDesc: "Accepted" });
    let outcome;
    try {
      outcome = parseCallback(await readJson(request));
    } catch (error) {
      log(`Ignored a callback we couldn't read: ${error instanceof Error ? error.message : error}`);
      return accepted();
    }

    const order = byCheckout.get(outcome.checkoutRequestId);
    if (!order) {
      log(`Ignored a callback for an unknown payment ${outcome.checkoutRequestId}`);
      return accepted();
    }
    if (order.status !== "pending") {
      log(`Ignored a repeated callback for order ${order.id}`);
      return accepted(); // callbacks can arrive twice: the first one decides
    }

    if (outcome.status === "paid") {
      if (outcome.amount !== order.totalKes) {
        order.status = "failed";
        order.note = `Paid KES ${outcome.amount}, expected KES ${order.totalKes}. A person needs to check this.`;
      } else {
        order.status = "paid";
        order.receipt = outcome.receipt;
        order.note = `Paid. M-Pesa receipt ${outcome.receipt}. Enjoy the show!`;
      }
    } else {
      order.status = outcome.status;
      order.note = outcome.reason;
    }
    log(`Order ${order.id}: ${order.status}`);
    accepted();
  }

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const buyMatch = /^\/events\/([\w-]+)\/tickets$/.exec(url.pathname);
    const orderMatch = /^\/orders\/([\w-]+)$/.exec(url.pathname);

    if (request.method === "POST" && buyMatch) {
      void buy(buyMatch[1], request, response);
    } else if (request.method === "POST" && url.pathname === `/mpesa/callback/${options.callbackSecret}`) {
      void callback(request, response);
    } else if (request.method === "GET" && orderMatch) {
      const order = orders.get(orderMatch[1]);
      if (!order) return send(response, 404, { error: "No such order" });
      const { checkoutRequestId: _hidden, ...visible } = order;
      send(response, 200, visible);
    } else {
      send(response, 404, { error: "Not found" });
    }
  });

  return { server, orders };
}
