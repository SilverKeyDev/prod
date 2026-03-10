/**
 * URL parsing for deep links (pathname extraction).
 * No platform APIs; pure functions only.
 */

/**
 * Extract pathname from a full URL string (e.g. from Linking.getInitialURL).
 */
export function getPathnameFromUrl(url: string | null): string {
  if (!url) return "/";
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
}
