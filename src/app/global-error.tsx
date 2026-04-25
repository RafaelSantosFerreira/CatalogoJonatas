"use client";

import { useEffect } from "react";
import { logAppError } from "@/lib/app-logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logAppError("global-error.tsx", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
        <h2 className="text-xl font-semibold">Erro na aplicação</h2>
        <p className="text-center text-sm text-muted-foreground max-w-md">
          O erro foi registrado nos logs (console e servidor, se disponível).
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
