import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, requireJson, sanitizeString } from "@/lib/security";

function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — registrasi owner pertama (hanya sekali per instalasi)
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 5);
  if (limited) return limited;

  const contentError = requireJson(req);
  if (contentError) return contentError;

  const secret = getSecret();
  if (!secret) {
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const input = body as { nama?: unknown; namaKos?: unknown; email?: unknown; password?: unknown };
  const nama = sanitizeString(input.nama, 100);
  const namaKos = sanitizeString(input.namaKos, 100);
  const email = sanitizeString(input.email, 320)?.toLowerCase() ?? null;
  const password = typeof input.password === "string" ? input.password : null;

  if (!nama || !namaKos || !email || !password) {
    return NextResponse.json({ error: "Field wajib: nama, namaKos, email, password" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password harus 8-200 karakter" }, { status: 400 });
  }

  const db = getDb();
  const passwordHash = hashPassword(password);

  try {
    const user = db.transaction(() => {
      const existing = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
      if (existing.c > 0) throw new Error("OWNER_EXISTS");

      const result = db
        .prepare("INSERT INTO users (email, nama, password_hash, role) VALUES (?, ?, ?, 'owner')")
        .run(email, nama, passwordHash);
      const id = Number(result.lastInsertRowid);

      const upsert = db.prepare(
        "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
      );
      upsert.run("nama_kos", namaKos);
      upsert.run("nama_pemilik", nama);

      return { id };
    })();

    const token = await new SignJWT({ role: "owner", sub: String(user.id), nama })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json(
      { ok: true, user: { id: user.id, email, nama, role: "owner" } },
      { status: 201 }
    );
    res.cookies.set("kostku_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    if (err instanceof Error && err.message === "OWNER_EXISTS") {
      return NextResponse.json({ error: "Akun owner sudah ada. Silakan masuk." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal membuat akun owner" }, { status: 500 });
  }
}
