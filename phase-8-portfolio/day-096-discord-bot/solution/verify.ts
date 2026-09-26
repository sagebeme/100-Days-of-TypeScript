import { createPublicKey, verify } from "node:crypto";

// Discord signs every request it sends your bot: an Ed25519 signature of timestamp + body, made with
// Discord's private key. Anyone can POST to your endpoint; only Discord can make a signature your
// application's public key accepts. Check it on the raw body, before parsing anything.

// An Ed25519 public key in the DER "SubjectPublicKeyInfo" wrapping Node wants: a fixed 12-byte
// header, then the 32 raw bytes Discord gives you (as 64 hex characters).
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export interface SignedRequest {
  body: string;
  signature: string | undefined; // X-Signature-Ed25519
  timestamp: string | undefined; // X-Signature-Timestamp, in seconds
  publicKey: string; // hex, from the developer portal
  now?: number; // ms
}

export const MAX_AGE_SECONDS = 5 * 60;

export function verifyDiscordRequest({ body, signature, timestamp, publicKey, now = Date.now() }: SignedRequest): boolean {
  if (!signature || !/^[0-9a-f]{128}$/i.test(signature)) return false;
  if (!timestamp || !/^\d{1,12}$/.test(timestamp)) return false;
  if (!/^[0-9a-f]{64}$/i.test(publicKey)) return false;
  // A signature stays valid forever. Refusing old ones means a captured request can't be replayed later.
  if (Math.abs(now / 1000 - Number(timestamp)) > MAX_AGE_SECONDS) return false;
  const key = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey, "hex")]), format: "der", type: "spki" });
  return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
}
