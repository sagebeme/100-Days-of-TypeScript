import { getSeats, someoneBought } from "../../../../../lib/events.ts";

// GET /api/events/3/seats -> { "available": 6 }. A route handler: an API endpoint inside the Next app.
export const dynamic = "force-dynamic";

// TODO:
// - An id that isn't a whole number from 1 up, or an event getSeats doesn't know (null): 404 { error: "No such event" }.
// - Call someoneBought(id) first (the demo's other fans), then answer Response.json({ available }) with the
//   header "Cache-Control: no-store": never cache a number that changes every few seconds.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  void [getSeats, someoneBought];
  return Response.json({ error: `TODO: seats for ${id}` }, { status: 501 });
}
