import { getServer } from "../../../server/context.ts";

// Every /api/... request goes to Day 66's Hono API. A Hono app is just a function from a Request
// to a Response, which is exactly what a Next.js route handler is: the whole API mounts in one line.
async function handle(request: Request): Promise<Response> {
  const { api } = await getServer();
  return api.fetch(request);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;

// The API reads cookies and a database that changes: never cache it.
export const dynamic = "force-dynamic";
