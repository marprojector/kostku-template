import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "../src/lib/password";

test("hashPassword tidak menyimpan password mentah", () => {
  const hash = hashPassword("rahasia123");
  assert.ok(hash.startsWith("scrypt$"));
  assert.ok(!hash.includes("rahasia123"));
});

test("verifyPassword menerima password yang benar", () => {
  const hash = hashPassword("rahasia123");
  assert.equal(verifyPassword("rahasia123", hash), true);
});

test("verifyPassword menolak password salah", () => {
  const hash = hashPassword("rahasia123");
  assert.equal(verifyPassword("salah", hash), false);
});

test("verifyPassword menolak format hash rusak", () => {
  assert.equal(verifyPassword("apa saja", "bukan-hash"), false);
  assert.equal(verifyPassword("apa saja", "scrypt$abc$"), false);
});
