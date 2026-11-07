import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { rateLimit, requireJson, sanitizeString } from "@/lib/security";

function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? new TextEncoder().encode(value) : null;
}

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const secret = getSecret();
  if (!secret || !process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) {
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 503 });
  }

  const limited = rateLimit(req);
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
  const email = sanitizeString(input.email, 320);
  const password = typeof input.password === "string" ? input.password : null;

  if (!email || !password || email !== process.env.OWNER_EMAIL || password !== process.env.OWNER_PASSWORD) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("kostku_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
