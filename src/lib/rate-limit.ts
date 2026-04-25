type RateState = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateState>();

function nowMs(): number {
  return Date.now();
}

function parseIp(request: Request): string {
  const h =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  if (!h) return "unknown";
  return h.split(",")[0].trim() || "unknown";
}

/**
 * Rate limiter em memória (process-local). Em produção distribuída use Redis/KV.
 */
export function checkRateLimit(params: {
  request: Request;
  key: string;
  windowMs: number;
  max: number;
}): { allowed: boolean; retryAfterSec: number; remaining: number } {
  const { request, key, windowMs, max } = params;
  const bucket = `${key}:${parseIp(request)}`;
  const t = nowMs();
  const current = store.get(bucket);

  if (!current || t >= current.resetAt) {
    const resetAt = t + windowMs;
    store.set(bucket, { count: 1, resetAt });
    return { allowed: true, retryAfterSec: Math.ceil(windowMs / 1000), remaining: max - 1 };
  }

  if (current.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - t) / 1000));
    return { allowed: false, retryAfterSec, remaining: 0 };
  }

  current.count += 1;
  store.set(bucket, current);
  return {
    allowed: true,
    retryAfterSec: Math.ceil((current.resetAt - t) / 1000),
    remaining: max - current.count,
  };
}

