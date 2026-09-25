import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }) => Promise<Buffer>;

// scrypt is slow on purpose, and needs lots of memory: fine for one login, ruinous for someone
// trying a billion guesses against a stolen database. These settings are stored with each hash,
// so they can be raised later without breaking old passwords.
export const COST = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 32;

// "scrypt$16384$8$1$<salt>$<hash>": everything needed to check a password later, and nothing more.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16); // a new random salt for every password, so equal passwords get different hashes
  const hash = await scryptAsync(password, salt, KEY_LENGTH, COST);
  return ["scrypt", COST.N, COST.r, COST.p, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  // timingSafeEqual takes the same time however many characters match, so the timing gives nothing away.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Real rules, from how passwords actually get broken: length matters most; common passwords and
// passwords made from your own details are the first things an attacker tries.
const COMMON = new Set(["password123", "1234567890", "qwertyuiop", "iloveyou12", "nairobi2026", "kenya12345", "password1!"]);

export function passwordProblem(password: string, details: { email: string; name: string }): string | null {
  if (password.length < 10) return "Use at least 10 characters";
  if (password.length > 200) return "Use at most 200 characters";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common";
  const emailName = details.email.split("@")[0].toLowerCase();
  if ((emailName.length >= 4 && lower.includes(emailName)) || (details.name.length >= 4 && lower.includes(details.name.toLowerCase()))) {
    return "Don't use your name or email in your password";
  }
  return null;
}
