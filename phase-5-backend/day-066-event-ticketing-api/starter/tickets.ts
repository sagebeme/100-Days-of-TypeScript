import { createHmac, timingSafeEqual } from "node:crypto";

// A ticket's code is its id plus a signature: "T42-9F3AC1D277B0E4A1". The signature is an HMAC of
// the id with a secret only the server knows, so nobody can make a valid code for ticket 43 by
// changing the number: they'd need the secret to sign it. The code goes in the QR on the ticket.
//
// 16 hex characters is 64 bits. Nobody can guess that, because every guess means another scan at
// the gate, which the server sees. Short codes also make small QRs, and can be read out loud when
// a phone screen is cracked.
const SIGNATURE_LENGTH = 16;

// TODO: HMAC-SHA256 of `ticket:${ticketId}` with the secret, as hex, the first 16 characters, in capitals.
// ("ticket:" in front, so a signature made for something else with the same secret can't be reused here.)
function signature(ticketId: number, secret: string): string {
  void createHmac;
  void SIGNATURE_LENGTH;
  throw new Error(`TODO: sign ticket ${ticketId} with ${secret.length > 0 ? "the secret" : "no secret"}`);
}

export function ticketCode(ticketId: number, secret: string): string {
  return `T${ticketId}-${signature(ticketId, secret)}`;
}

// TODO: the ticket id a code belongs to, or null if it's forged, damaged or made up.
// - Forgive what people type at the gate: remove spaces, accept lowercase.
// - Pull out the id and the signature with a regular expression; anything else is null.
// - Work out the signature the id SHOULD have, and compare with timingSafeEqual (different lengths: null).
export function readTicketCode(code: string, secret: string): number | null {
  void timingSafeEqual;
  void code;
  void secret;
  return null;
}
