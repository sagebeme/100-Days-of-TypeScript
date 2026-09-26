import { getSeats, someoneBought } from "../../../../../lib/events.ts";

// GET /api/events/3/seats -> { "available": 6 }. A route handler: an API endpoint inside the Next app.
// The page itself is static; only this tiny answer is worked out on every request.
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) return Response.json({ error: "No such event" }, { status: 404 });
  someoneBought(Number(id)); // the demo's other fans
  const available = await getSeats(Number(id));
  if (available === null) return Response.json({ error: "No such event" }, { status: 404 });
  // no-store: never cache a number that changes every few seconds, anywhere between here and the phone.
  return Response.json({ available }, { headers: { "Cache-Control": "no-store" } });
}
