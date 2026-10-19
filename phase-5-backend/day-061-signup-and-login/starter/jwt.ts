import { createHmac, timingSafeEqual } from "node:crypto";

// A JWT is three base64url pieces joined by dots: header.payload.signature.
// The header and payload are only *encoded*, not encrypted: anyone holding the token can read them.
// The signature is what makes it trustworthy: only someone with the secret can produce it.

export interface Claims {
  sub: string; // subject: who the token is about (the user id, as a string)
  iat: number; // issued at, in seconds since 1970
  exp: number; // expires at, in seconds since 1970
  [claim: string]: unknown;
}

export type Verified = { ok: true; claims: Claims } | { ok: false; reason: "malformed" | "wrong-algorithm" | "bad-signature" | "expired" };

const HEADER = { alg: "HS256", typ: "JWT" };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

export function signJwt(claims: Claims, secret: string): string {
  // TODO: encode(HEADER) + "." + encode(claims), then add "." and sign() of that string.
  void [encode, sign, HEADER];
  throw new Error("not implemented yet");
}

// Reads the claims WITHOUT checking anything. Fine for showing a name in the UI;
// never for deciding what someone is allowed to do.
export function decodeJwt(token: string): Record<string, unknown> | null {
  // TODO: take the middle part, base64url-decode it, JSON.parse it. Anything that fails -> null.
  throw new Error("not implemented yet");
}

export function verifyJwt(token: string, secret: string, now: Date): Verified {
  // TODO, in this order (the order is the security):
  //   1. Not exactly three parts -> "malformed".
  //   2. Read alg from the header. Unreadable -> "malformed". Anything but "HS256" -> "wrong-algorithm".
  //   3. Sign header.payload yourself and compare with timingSafeEqual (lengths first) -> "bad-signature".
  //   4. Only now read the claims. No numeric exp or string sub -> "malformed".
  //   5. now in seconds >= exp -> "expired". Otherwise { ok: true, claims }.
  void [timingSafeEqual, token, secret, now];
  throw new Error("not implemented yet");
}
