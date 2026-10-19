import { createHash, randomBytes } from "node:crypto";

export const REFRESH_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// A refresh token is an opaque random string, like Part 1's session token, and it's stored the same way: as a hash.
// Every refresh *rotates* it: the old one is used up and a new one is issued in the same family.
// If a used-up token ever comes back, someone has a copy, so the whole family is revoked and both of them must log in again.

interface StoredToken {
  userId: number;
  family: string;
  expiresAt: number;
  used: boolean;
}

export type Rotated = { ok: true; token: string; userId: number } | { ok: false; reason: "unknown" | "expired" | "reused" | "revoked" };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export class RefreshTokens {
  // In a real app these are database tables. A Map keeps today about the rules, not the SQL.
  private tokens = new Map<string, StoredToken>();
  private revokedFamilies = new Set<string>();

  issue(userId: number, now: Date, family: string = newToken()): string {
    // TODO: make a new token, store it under hash(token) with this family, expiring REFRESH_DAYS from now, not used.
    void [hash, DAY, userId, now, family];
    throw new Error("not implemented yet");
  }

  rotate(token: string, now: Date): Rotated {
    // TODO, in this order:
    //   not stored -> "unknown"; its family revoked -> "revoked";
    //   already used -> revoke the family, "reused"; past expiresAt -> "expired";
    //   otherwise mark it used and issue a new token in the SAME family.
    void [token, now];
    throw new Error("not implemented yet");
  }

  // Logging out revokes the family, so no copy of any token in it works again.
  revoke(token: string): void {
    // TODO: if the token is stored, revoke its family.
    void token;
    throw new Error("not implemented yet");
  }

  // What's actually stored: hashes only. The tests look in here.
  storedKeys(): string[] {
    return [...this.tokens.keys()];
  }
}
