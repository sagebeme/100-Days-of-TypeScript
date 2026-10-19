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
  const unsigned = `${encode(HEADER)}.${encode(claims)}`;
  return `${unsigned}.${sign(unsigned, secret)}`;
}

// Reads the claims WITHOUT checking anything. Fine for showing a name in the UI;
// never for deciding what someone is allowed to do.
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function verifyJwt(token: string, secret: string, now: Date): Verified {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [header, payload, signature] = parts;

  let alg: unknown;
  try {
    alg = JSON.parse(Buffer.from(header, "base64url").toString()).alg;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  // Decide the algorithm yourself. Trusting the header lets an attacker send alg "none" with no signature.
  if (alg !== "HS256") return { ok: false, reason: "wrong-algorithm" };

  const expected = Buffer.from(sign(`${header}.${payload}`, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return { ok: false, reason: "bad-signature" };

  // Only now, with the signature checked, is the payload worth reading.
  const claims = decodeJwt(token) as Claims | null;
  if (!claims || typeof claims.exp !== "number" || typeof claims.sub !== "string") return { ok: false, reason: "malformed" };
  if (now.getTime() / 1000 >= claims.exp) return { ok: false, reason: "expired" };
  return { ok: true, claims };
}
