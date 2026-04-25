import { checkRateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 24_000;

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit({
      request,
      key: "api:client-logs",
      windowMs: 60_000,
      max: 120,
    });
    if (!rl.allowed) {
      return new Response(null, {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      });
    }

    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      console.error("[client-logs] payload too large:", buf.byteLength);
      return new Response(null, { status: 413 });
    }
    const text = new TextDecoder().decode(buf);
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = { raw: text.slice(0, 2000) };
    }
    console.error("[client-logs]", JSON.stringify(parsed, null, 2));
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error("[client-logs] handler failure:", e);
    return new Response(null, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
