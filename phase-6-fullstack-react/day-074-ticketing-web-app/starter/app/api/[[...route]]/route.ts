import { getServer } from "../../../server/context.ts";

// TODO: every /api/... request goes to Day 66's Hono API. A Hono app is a function from a Request to
// a Response, and so is a Next.js route handler: get the server, and answer with api.fetch(request).
// Export it as GET, POST, PATCH and DELETE.
async function handle(request: Request): Promise<Response> {
  void getServer;
  return Response.json({ error: `TODO: the API (${new URL(request.url).pathname})` }, { status: 501 });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;

// The API reads cookies and a database that changes: never cache it.
export const dynamic = "force-dynamic";
