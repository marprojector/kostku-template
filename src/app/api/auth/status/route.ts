import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/security";

// GET /api/auth/status — apakah instalasi ini masih butuh registrasi owner pertama
export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 60);
  if (limited) return limited;

  const row = getDb().prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  return NextResponse.json({ needsSetup: row.c === 0 });
}
