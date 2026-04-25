import { NextResponse } from "next/server";
import { logAppError } from "@/lib/app-logger";

export async function GET() {
  try {
    return NextResponse.json({ status: "ok" });
  } catch (e) {
    logAppError("api/health", e);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}