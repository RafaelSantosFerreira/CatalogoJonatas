import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logAppError } from "@/lib/app-logger";

export function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();

    response.headers.set("X-Frame-Options", "ALLOWALL");
    response.headers.set("Content-Security-Policy", "frame-ancestors *");

    return response;
  } catch (e) {
    logAppError("middleware", e, { pathname: request.nextUrl.pathname });
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
} 