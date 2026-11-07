import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

// GET /api/auth/me — cek status login
export async function GET(req: NextRequest) {
  const token = req.cookies.get("kostku_token")?.value;
  const secret = getSecret();
  if (!token || !secret) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
