export function asError(e: unknown): Error & { code?: string } {
  if (e instanceof Error) return e;
  return new Error(typeof e === "string" ? e : JSON.stringify(e));
}
