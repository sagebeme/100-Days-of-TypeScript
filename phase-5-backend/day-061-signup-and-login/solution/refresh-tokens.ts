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
    const token = newToken();
    this.tokens.set(hash(token), { userId, family, expiresAt: now.getTime() + REFRESH_DAYS * DAY, used: false });
    return token;
  }

  rotate(token: string, now: Date): Rotated {
    const stored = this.tokens.get(hash(token));
    if (!stored) return { ok: false, reason: "unknown" };
    if (this.revokedFamilies.has(stored.family)) return { ok: false, reason: "revoked" };
    if (stored.used) {
      this.revokedFamilies.add(stored.family); // a second use means a stolen copy: shut the whole family down
      return { ok: false, reason: "reused" };
    }
    if (now.getTime() >= stored.expiresAt) return { ok: false, reason: "expired" };
    stored.used = true;
    return { ok: true, token: this.issue(stored.userId, now, stored.family), userId: stored.userId };
  }

  // Logging out revokes the family, so no copy of any token in it works again.
  revoke(token: string): void {
    const stored = this.tokens.get(hash(token));
    if (stored) this.revokedFamilies.add(stored.family);
  }

  // What's actually stored: hashes only. The tests look in here.
  storedKeys(): string[] {
    return [...this.tokens.keys()];
  }
}
