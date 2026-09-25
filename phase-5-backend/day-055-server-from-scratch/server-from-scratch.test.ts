import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { request as httpRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Router } from "./starter/http-kit.ts";
import { createApp, type Stage } from "./starter/app.ts";

const stages: Stage[] = [
  { id: "kencom", name: "Kencom", routes: ["33", "34", "46"] },
  { id: "railways", name: "Railways", routes: ["33", "58"] },
  { id: "odeon", name: "Odeon", routes: ["44", "237"] },
];

describe("Router", () => {
  const noop = () => {};
  const router = new Router().on("GET", "/stages", noop).on("GET", "/stages/:id", noop).on("POST", "/stages/:id/reports", noop).on("GET", "/stages/:id/reports", noop);

  it("finds a route and its params", () => {
    const found = router.find("GET", "/stages/kencom");
    expect(found.handler).toBe(noop);
    expect(found.params).toEqual({ id: "kencom" });
  });

  it("decodes params", () => {
    expect(router.find("GET", "/stages/ronald%20ngala").params).toEqual({ id: "ronald ngala" });
  });

  it("ignores trailing slashes", () => {
    expect(router.find("GET", "/stages/").handler).toBe(noop);
  });

  it("lists the methods a path allows when the method is wrong", () => {
    expect(router.find("DELETE", "/stages/kencom/reports")).toEqual({ handler: null, params: {}, allowed: ["POST", "GET"] });
  });

  it("says nothing matches a path it doesn't know", () => {
    expect(router.find("GET", "/buses")).toEqual({ handler: null, params: {}, allowed: [] });
    expect(router.find("GET", "/stages/kencom/reports/extra").handler).toBeNull();
  });
});

describe("the stage API", () => {
  let server: Server;
  let base: string;
  let logs: string[];
  let clock: Date;

  beforeEach(async () => {
    logs = [];
    clock = new Date("2026-10-05T07:30:00Z");
    server = createApp({ stages, now: () => clock, log: (line) => logs.push(line) });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const report = (id: string, body: unknown, contentType = "application/json") =>
    fetch(`${base}/stages/${id}/reports`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("answers a health check", async () => {
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toEqual({ ok: true, uptimeSeconds: 0 });
  });

  it("lists and filters stages", async () => {
    expect((await (await fetch(`${base}/stages`)).json()).stages).toHaveLength(3);
    expect((await (await fetch(`${base}/stages?route=33`)).json()).stages.map((s: Stage) => s.id)).toEqual(["kencom", "railways"]);
    expect((await (await fetch(`${base}/stages?q=ODE`)).json()).stages.map((s: Stage) => s.id)).toEqual(["odeon"]);
  });

  it("shows one stage, with no report yet", async () => {
    expect(await (await fetch(`${base}/stages/kencom`)).json()).toEqual({ ...stages[0], latestReport: null });
  });

  it("takes a crowd report and shows it as the latest", async () => {
    const response = await report("kencom", { crowd: "packed" });
    expect(response.status).toBe(201);
    const created = await response.json();
    expect(created).toMatchObject({ stageId: "kencom", crowd: "packed", at: "2026-10-05T07:30:00.000Z" });
    expect(response.headers.get("location")).toBe(`/stages/kencom/reports/${created.id}`);

    clock = new Date("2026-10-05T07:45:00Z");
    await report("kencom", { crowd: "ok" });
    expect((await (await fetch(`${base}/stages/kencom`)).json()).latestReport.crowd).toBe("ok");
    const { reports } = await (await fetch(`${base}/stages/kencom/reports`)).json();
    expect(reports.map((r: { crowd: string }) => r.crowd)).toEqual(["ok", "packed"]);
  });

  it("keeps each stage's reports separate", async () => {
    await report("kencom", { crowd: "packed" });
    expect((await (await fetch(`${base}/stages/odeon/reports`)).json()).reports).toEqual([]);
  });

  it("returns 404 for an unknown stage or path", async () => {
    const stage = await fetch(`${base}/stages/nowhere`);
    expect(stage.status).toBe(404);
    expect(await stage.json()).toEqual({ error: "No stage called nowhere" });
    expect((await report("nowhere", { crowd: "ok" })).status).toBe(404);
    const path = await fetch(`${base}/buses`);
    expect(path.status).toBe(404);
    expect(await path.json()).toEqual({ error: "Nothing at /buses" });
  });

  it("returns 405 with an Allow header for the wrong method", async () => {
    const response = await fetch(`${base}/stages/kencom`, { method: "DELETE" });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
    expect(await response.json()).toEqual({ error: "DELETE isn't allowed here" });
  });

  it("rejects a report that isn't JSON (415), isn't valid JSON (400), or has a bad crowd (400)", async () => {
    const form = await report("kencom", "crowd=packed", "application/x-www-form-urlencoded");
    expect(form.status).toBe(415);
    expect(await form.json()).toEqual({ error: "Send JSON, with Content-Type: application/json" });

    const broken = await report("kencom", "{crowd: packed");
    expect(broken.status).toBe(400);
    expect(await broken.json()).toEqual({ error: "The body isn't valid JSON" });

    const bad = await report("kencom", { crowd: "full" });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: "crowd must be one of: empty, ok, packed" });

    expect((await report("kencom", "null")).status).toBe(400);
  });

  it("refuses a huge body (413)", async () => {
    const response = await report("kencom", { crowd: "ok", note: "x".repeat(20_000) });
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Body too large: the limit is 10000 bytes" });
  });

  it("counts what really arrives, even when the sender lies about the size", async () => {
    const { port } = server.address() as AddressInfo;
    const status = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(
        { port, method: "POST", path: "/stages/kencom/reports", headers: { "Content-Type": "application/json", "Transfer-Encoding": "chunked" } },
        (response) => {
          response.resume();
          resolve(response.statusCode ?? 0);
        },
      );
      request.on("error", reject);
      for (let i = 0; i < 30; i++) request.write("x".repeat(1000));
      request.end();
    });
    expect(status).toBe(413);
  });

  it("logs every request with its status and time", async () => {
    await fetch(`${base}/stages/kencom`);
    await fetch(`${base}/nope`);
    expect(logs[0]).toMatch(/^GET \/stages\/kencom 200 \d+\.\dms$/);
    expect(logs[1]).toMatch(/^GET \/nope 404 /);
  });
});
