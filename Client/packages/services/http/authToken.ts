/** With HTTP-only cookies, tokens are never accessible to JavaScript. */
export function getAuthToken(): string | null {
  return null;
}
