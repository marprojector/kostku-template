import { NextRequest, NextResponse } from "next/server";


/**
 * Rate-limit state kept outside the hot path — one integer counter per IP.
 * For single-server deployments this is sufficient. For multi-instance
 * deployments, swap this for a Redis-backed store.
 */
const ipCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;   // per IP per window

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = clientIp(req);
  const now = Date.now();
  const record = ipCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan, coba beberapa saat lagi" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  record.count++;
  return null;
}

/** Validate that a string is a safe, non-empty value. */
export function sanitizeString(value: unknown, maxLen = 255): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  return value.trim().slice(0, maxLen);
}

/** Validate a numeric ID parameter. */
export function sanitizeId(value: unknown): number | null {
  const n = typeof value === "string" ? parseInt(value, 10) : typeof value === "number" ? value : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Reject requests that do not carry a JSON Content-Type. */
export function requireJson(req: NextRequest): NextResponse | null {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type application/json diperlukan" }, { status: 415 });
  }
  return null;
}

