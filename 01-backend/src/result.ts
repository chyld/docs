export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; status: number };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });

export const err = (error: string, status = 400): Result<never, string> => ({
  ok: false,
  error,
  status,
});

export const toResponse = <T>(result: Result<T>): Response =>
  result.ok
    ? Response.json(result.data)
    : Response.json({ error: result.error }, { status: result.status });

export const toResponseCreated = <T>(result: Result<T>): Response =>
  result.ok
    ? Response.json(result.data, { status: 201 })
    : Response.json({ error: result.error }, { status: result.status });
