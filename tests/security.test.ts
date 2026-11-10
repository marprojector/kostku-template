import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { rateLimit, sanitizeString, sanitizeId, requireJson } from "../src/lib/security";

function request(path: string, init: { ip?: string; contentType?: string } = {}): NextRequest {
  const headers = new Headers();
  if (init.ip) headers.set("x-forwarded-for", init.ip);
  if (init.contentType) headers.set("content-type", init.contentType);
  return new NextRequest(`http://localhost${path}`, { headers });
}

test("sanitizeString menolak nilai kosong / bukan string", () => {
  assert.equal(sanitizeString("  Budi  "), "Budi");
  assert.equal(sanitizeString(""), null);
  assert.equal(sanitizeString("   "), null);
  assert.equal(sanitizeString(123), null);
  assert.equal(sanitizeString(null), null);
  assert.equal(sanitizeString(undefined), null);
});

test("sanitizeString memotong nilai sesuai maxLen", () => {
  assert.equal(sanitizeString("abcdefghij", 4), "abcd");
  assert.equal(sanitizeString("  abcdefghij  ", 4), "abcd");
});

test("sanitizeId menerima integer positif saja", () => {
  assert.equal(sanitizeId("12"), 12);
  assert.equal(sanitizeId(7), 7);
  assert.equal(sanitizeId("0"), null);
  assert.equal(sanitizeId("-3"), null);
  assert.equal(sanitizeId("1.5"), 1);
  assert.equal(sanitizeId("abc"), null);
  assert.equal(sanitizeId(Number.NaN), null);
  assert.equal(sanitizeId(Infinity), null);
  assert.equal(sanitizeId(null), null);
});

test("requireJson menolak request tanpa application/json", () => {
  const tanpaHeader = requireJson(request("/api/kamar"));
  assert.ok(tanpaHeader);
  assert.equal(tanpaHeader.status, 415);

  const salahTipe = requireJson(request("/api/kamar", { contentType: "text/plain" }));
  assert.ok(salahTipe);
  assert.equal(salahTipe.status, 415);

  const benar = requireJson(request("/api/kamar", { contentType: "application/json; charset=utf-8" }));
  assert.equal(benar, null);
});

test("rateLimit mengizinkan request di bawah batas", () => {
  const ip = "10.0.0.1";
  for (let i = 0; i < 5; i++) {
    assert.equal(rateLimit(request("/api/uji-izin", { ip })), null);
  }
});

test("rateLimit mengembalikan 429 setelah 120 request per IP+endpoint", () => {
  const ip = "10.0.0.2";
  const endpoint = "/api/uji-batas";

  for (let i = 0; i < 120; i++) {
    assert.equal(rateLimit(request(endpoint, { ip })), null, `request ke-${i + 1} harus lolos`);
  }

  const ditolak = rateLimit(request(endpoint, { ip }));
  assert.ok(ditolak, "request ke-121 harus ditolak");
  assert.equal(ditolak.status, 429);
  assert.equal(ditolak.headers.get("Retry-After"), "60");
});

test("rateLimit memisahkan kuota per IP dan per endpoint", () => {
  const endpoint = "/api/uji-pisah";
  const ipA = "10.0.0.3";
  const ipB = "10.0.0.4";

  for (let i = 0; i < 120; i++) {
    rateLimit(request(endpoint, { ip: ipA }));
  }
  assert.ok(rateLimit(request(endpoint, { ip: ipA })));
  // IP lain tetap boleh
  assert.equal(rateLimit(request(endpoint, { ip: ipB })), null);
  // Endpoint lain dari IP yang sama juga tetap boleh
  assert.equal(rateLimit(request("/api/uji-pisah-lain", { ip: ipA })), null);
});
