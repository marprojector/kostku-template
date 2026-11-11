import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { rateLimit, requireJson, sanitizeString } from "@/lib/security";

function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? new TextEncoder().encode(value) : null;
}

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const secret = getSecret();
  if (!secret) {
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 503 });
  }

  const limited = rateLimit(req, 10);
  if (limited) return limited;

  const contentError = requireJson(req);
  if (contentError) return contentError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const input = body as { email?: unknown; password?: unknown };
  const email = sanitizeString(input.email, 320)?.toLowerCase() ?? null;
  const password = typeof input.password === "string" ? input.password : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const user = getDb()
    .prepare("SELECT id, email, nama, password_hash, role FROM users WHERE email = ? COLLATE NOCASE")
    .get(email) as
    | { id: number; email: string; nama: string; password_hash: string; role: string }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const token = await new SignJWT({ role: user.role, sub: String(user.id), nama: user.nama })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, nama: user.nama, role: user.role },
  });
  res.cookies.set("kostku_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
