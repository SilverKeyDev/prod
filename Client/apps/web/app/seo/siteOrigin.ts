/** Normalized public site origin (no trailing slash). Empty when unset (e.g. local dev). */
export function normalizeSiteOrigin(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  return raw.trim().replace(/\/$/, "");
}

export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return normalizeSiteOrigin(window.location.origin);
  }
  return "";
}

/** Absolute URL for a path starting with `/`, or empty string if origin is unset. */
export function absoluteUrl(pathnameOrPath: string): string {
  const origin = getSiteOrigin();
  if (!origin) return "";
  if (pathnameOrPath.startsWith("/")) return `${origin}${pathnameOrPath}`;
  return `${origin}/${pathnameOrPath}`;
}
