import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const rawSecret = process.env.AUTH_SECRET;
const secret = rawSecret && rawSecret.length >= 32 ? new TextEncoder().encode(rawSecret) : null;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publicPath =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/status" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/auth/logout";
  if (publicPath) return NextResponse.next();

  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 503 });
  }

  const token = req.cookies.get("kostku_token")?.value;
  if (!token || !secret) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

  return jwtVerify(token, secret, { algorithms: ["HS256"] })
    .then(() => NextResponse.next())
    .catch(() => {
      const res = NextResponse.json({ error: "Sesi tidak valid atau kedaluwarsa" }, { status: 401 });
      res.cookies.set("kostku_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return res;
    });
}

export const config = { matcher: ["/api/:path*"] };
