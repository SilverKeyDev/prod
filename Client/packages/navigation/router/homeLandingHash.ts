/**
 * Public marketing home may use in-page section hashes (e.g. `/#about`).
 * `href` values like `/#section-id` should scroll, not perform a full navigation away from `/`.
 */
export function homeLandingSectionIdFromHref(href: string): string | null {
  const m = href.match(/^\/#([\w-]+)$/);
  return m?.[1] ?? null;
}
