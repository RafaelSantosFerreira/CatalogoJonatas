/**
 * Retorna o resultado da promise ou `null` se `ms` expirar (fetch continua em background).
 */
export async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  const winner = await Promise.race([
    Promise.resolve(promise).then((value) => ({ kind: "ok" as const, value })),
    new Promise<{ kind: "timeout" }>((resolve) => {
      setTimeout(() => resolve({ kind: "timeout" }), ms);
    }),
  ]);
  if (winner.kind === "timeout") return null;
  return winner.value;
}
