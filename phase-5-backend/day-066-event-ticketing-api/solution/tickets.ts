import { createHmac, timingSafeEqual } from "node:crypto";

// A ticket's code is its id plus a signature: "T42-9F3AC1D277B0E4A1". The signature is an HMAC of
// the id with a secret only the server knows, so nobody can make a valid code for ticket 43 by
// changing the number: they'd need the secret to sign it. The code goes in the QR on the ticket.
//
// 16 hex characters is 64 bits. Nobody can guess that, because every guess means another scan at
// the gate, which the server sees. Short codes also make small QRs, and can be read out loud when
// a phone screen is cracked.
const SIGNATURE_LENGTH = 16;

function signature(ticketId: number, secret: string): string {
  // "ticket:" in front, so a signature made for something else with the same secret can't be reused here.
  return createHmac("sha256", secret).update(`ticket:${ticketId}`).digest("hex").slice(0, SIGNATURE_LENGTH).toUpperCase();
}

export function ticketCode(ticketId: number, secret: string): string {
  return `T${ticketId}-${signature(ticketId, secret)}`;
}

// The ticket id a code belongs to, or null if the code is forged, damaged or made up.
// Forgiving about what people type at the gate: spaces, lowercase.
export function readTicketCode(code: string, secret: string): number | null {
  const match = /^T(\d{1,12})-([0-9A-F]+)$/.exec(code.replace(/\s+/g, "").toUpperCase());
  if (!match) return null;
  const id = Number(match[1]);
  const given = Buffer.from(match[2]);
  const expected = Buffer.from(signature(id, secret));
  // timingSafeEqual: comparing takes the same time however many characters match, so the timing
  // doesn't give away how close a guess was.
  return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
}
