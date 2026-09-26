// Discord signs every request it sends your bot: an Ed25519 signature of timestamp + body, made with
// Discord's private key. Check it on the raw body, before parsing anything. The tests are the spec.
// Hint: node:crypto's createPublicKey and verify(null, …). Node wants the key in DER "spki" form:
// the 12 bytes 302a300506032b6570032100, then the 32 raw bytes Discord gives you.

export interface SignedRequest {
  body: string;
  signature: string | undefined; // X-Signature-Ed25519
  timestamp: string | undefined; // X-Signature-Timestamp, in seconds
  publicKey: string; // hex, from the developer portal
  now?: number; // ms
}

export const MAX_AGE_SECONDS = 5 * 60;

export function verifyDiscordRequest({ body, signature, timestamp, publicKey, now = Date.now() }: SignedRequest): boolean {
  throw new Error(`TODO: verifyDiscordRequest(${body.length} bytes, ${signature}, ${timestamp}, ${publicKey}, ${now})`);
}
