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
  // TODO: a new random 16-byte salt, then scryptAsync(password, salt, KEY_LENGTH, COST).
  //   Return "scrypt$N$r$p$<salt>$<hash>", with the salt and hash as base64url
  throw new Error("not implemented yet");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // TODO: split the stored string on "$". Not "scrypt", or missing parts -> false.
  // TODO: hash the password with the SAME salt and settings, then compare with timingSafeEqual
  //   (after checking the lengths match: timingSafeEqual throws on different lengths)
  void randomBytes;
  void timingSafeEqual;
  throw new Error("not implemented yet");
}

// Real rules, from how passwords actually get broken: length matters most; common passwords and
// passwords made from your own details are the first things an attacker tries.
const COMMON = new Set(["password123", "1234567890", "qwertyuiop", "iloveyou12", "nairobi2026", "kenya12345", "password1!"]);

export function passwordProblem(password: string, details: { email: string; name: string }): string | null {
  // TODO: in this order:
  //   under 10 characters -> "Use at least 10 characters"; over 200 -> "Use at most 200 characters"
  //   in COMMON (ignoring case) -> "That password is too common"
  //   contains the part of the email before @ (if 4+ characters) or the name (if 4+ characters), ignoring case
  //     -> "Don't use your name or email in your password"
  //   otherwise null
  void COMMON;
  throw new Error("not implemented yet");
}
