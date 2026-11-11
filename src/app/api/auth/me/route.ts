import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getDb } from "@/lib/db";

function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

// GET /api/auth/me — cek sesi dan data user yang login
export async function GET(req: NextRequest) {
  const token = req.cookies.get("kostku_token")?.value;
  const secret = getSecret();
  if (!token || !secret) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const user = getDb()
      .prepare("SELECT id, email, nama, role FROM users WHERE id = ?")
      .get(userId) as { id: number; email: string; nama: string; role: string } | undefined;
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
