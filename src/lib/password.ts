import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64");
  const hash = scryptSync(password, salt, KEYLEN).toString("base64");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashB64] = parts;
  try {
    const expected = Buffer.from(hashB64, "base64");
    if (expected.length !== KEYLEN) return false;
    const actual = scryptSync(password, salt, KEYLEN);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
