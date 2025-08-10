import { NextResponse } from "next/server";

export function middleware(req) {
  const res = NextResponse.next();

  // Basic security hardening
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // NOTE: Add a strict Content-Security-Policy if/when you eliminate any inline scripts.
  // res.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self';");

  return res;
}

export const config = {
  matcher: "/:path*"
};
