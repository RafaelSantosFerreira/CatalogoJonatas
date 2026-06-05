export function apiOk<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function apiError(message: string, status: number, details?: unknown): Response {
  return Response.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}
