/**
 * Logger central de erros e avisos — browser e Node (API routes, instrumentation).
 * No cliente, também envia POST para /api/client-logs (terminal do servidor em dev).
 */

export type AppLogPayload = {
  source: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  name?: string;
  extra?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
};

export function serializeUnknown(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
} {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack, name: error.name };
  }
  if (typeof error === "string") return { message: error };
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: String(error) };
  }
}

function buildPayload(
  source: string,
  level: "error" | "warn" | "info",
  error: unknown,
  extra?: Record<string, unknown>
): AppLogPayload {
  const base = serializeUnknown(error);
  const payload: AppLogPayload = {
    source,
    timestamp: new Date().toISOString(),
    level,
    message: base.message,
    stack: base.stack,
    name: base.name,
    extra,
  };
  if (typeof window !== "undefined") {
    payload.url = window.location.href;
    payload.userAgent = navigator.userAgent;
  }
  return payload;
}

/** Envia log do browser para o servidor (não bloqueia). */
function mirrorClientLogToServer(payload: AppLogPayload): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/client-logs", blob);
      return;
    }
  } catch {
    /* fallback abaixo */
  }
  fetch("/api/client-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Registra erro (console + payload estruturado).
 * No cliente: espelha para POST /api/client-logs.
 */
export function logAppError(
  source: string,
  error: unknown,
  extra?: Record<string, unknown>
): AppLogPayload {
  const payload = buildPayload(source, "error", error, extra);
  const prefix = `[AppError] ${payload.source} | ${payload.timestamp}`;
  console.error(prefix, payload.message, {
    stack: payload.stack,
    name: payload.name,
    extra: payload.extra,
    url: payload.url,
  });

  if (typeof window !== "undefined") {
    queueMicrotask(() => mirrorClientLogToServer(payload));
  }
  return payload;
}

export function logAppWarn(source: string, message: string, extra?: Record<string, unknown>): void {
  console.warn(`[AppWarn] ${source} | ${message}`, extra ?? "");
  if (typeof window !== "undefined") {
    const payload = buildPayload(source, "warn", message, extra);
    queueMicrotask(() => mirrorClientLogToServer(payload));
  }
}

export function logAppInfo(source: string, message: string, extra?: Record<string, unknown>): void {
  console.info(`[AppInfo] ${source} | ${message}`, extra ?? "");
  if (typeof window !== "undefined") {
    const payload = buildPayload(source, "info", message, extra);
    queueMicrotask(() => mirrorClientLogToServer(payload));
  }
}

export function createTraceId(prefix = "trace"): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
