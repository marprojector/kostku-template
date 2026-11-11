import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kostku-auth-test-"));
process.env.KOSTKU_DB_PATH = path.join(tmpDir, "auth.db");
process.env.AUTH_SECRET = "test-secret-yang-panjangnya-lebih-dari-32-karakter";

let counter = 0;
function req(url: string, method: string, body?: unknown): NextRequest {
  counter++;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": `198.51.100.${counter}`,
  };
  return new NextRequest(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const owner = {
  nama: "Ammar",
  namaKos: "Kos Template",
  email: "owner@example.com",
  password: "rahasia123",
};

after(async () => {
  const { closeDb } = await import("../src/lib/db");
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("registrasi owner pertama berhasil dan menutup registrasi berikutnya", async () => {
  const { POST: register } = await import("../src/app/api/auth/register/route");

  const res = await register(req("http://localhost/api/auth/register", "POST", owner));
  assert.equal(res.status, 201);
  const json = (await res.json()) as { ok: boolean; user: { email: string; role: string } };
  assert.equal(json.ok, true);
  assert.equal(json.user.email, owner.email);
  assert.equal(json.user.role, "owner");
  assert.match(res.headers.get("set-cookie") ?? "", /kostku_token=/);

  const { GET: status } = await import("../src/app/api/auth/status/route");
  const statusRes = await status(req("http://localhost/api/auth/status", "GET"));
  assert.deepEqual(await statusRes.json(), { needsSetup: false });

  const dupe = await register(
    req("http://localhost/api/auth/register", "POST", { ...owner, email: "kedua@example.com" })
  );
  assert.equal(dupe.status, 403);
});

test("login menolak password salah dan menerima password benar", async () => {
  const { POST: login } = await import("../src/app/api/auth/login/route");

  const bad = await login(
    req("http://localhost/api/auth/login", "POST", { email: owner.email, password: "salah" })
  );
  assert.equal(bad.status, 401);

  const ok = await login(
    req("http://localhost/api/auth/login", "POST", { email: owner.email, password: owner.password })
  );
  assert.equal(ok.status, 200);
  const json = (await ok.json()) as { user: { email: string } };
  assert.equal(json.user.email, owner.email);
  assert.match(ok.headers.get("set-cookie") ?? "", /kostku_token=/);
});

test("me mengembalikan data owner dari token", async () => {
  const { POST: login } = await import("../src/app/api/auth/login/route");
  const loginRes = await login(
    req("http://localhost/api/auth/login", "POST", { email: owner.email, password: owner.password })
  );
  const cookie = loginRes.headers.get("set-cookie") ?? "";
  const token = cookie.match(/kostku_token=([^;]+)/)?.[1];
  assert.ok(token);

  const { GET: me } = await import("../src/app/api/auth/me/route");
  const meReq = new NextRequest("http://localhost/api/auth/me", {
    headers: { cookie: `kostku_token=${token}` },
  });
  const meRes = await me(meReq);
  assert.equal(meRes.status, 200);
  const json = (await meRes.json()) as { authenticated: boolean; user: { email: string } };
  assert.equal(json.authenticated, true);
  assert.equal(json.user.email, owner.email);
});
