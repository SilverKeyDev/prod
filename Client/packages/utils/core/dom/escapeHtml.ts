/**
 * Escape a string for safe insertion into HTML (e.g. innerHTML).
 * Prevents XSS when rendering user-controlled or external data.
 */
export function escapeHtml(text: string | undefined | null): string {
  if (text == null || typeof text !== "string") return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}
