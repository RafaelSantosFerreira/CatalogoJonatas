import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logAppError } from "@/lib/app-logger";

const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: ws: wss:",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
].join("; ");

export function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    return response;
  } catch (e) {
    logAppError("middleware", e, { pathname: request.nextUrl.pathname });
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
} 