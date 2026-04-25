"use client";

import { useEffect } from "react";
import { logAppError } from "@/lib/app-logger";

/**
 * Captura erros globais no cliente: window.error e promises rejeitadas sem catch.
 */
export default function GlobalErrorCapture() {
  useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      const err = event.error;
      logAppError("window.error", err ?? new Error(event.message || "Erro desconhecido"), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      logAppError("window.unhandledrejection", event.reason);
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
