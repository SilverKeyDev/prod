/**
 * Generate a URL-safe slug from a property address
 */
export function generatePropertySlug(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .trim();
}

/**
 * Build a full property detail URL with zpid and address slug
 */
export function buildPropertyUrl(zpid: string | number | undefined, address: string): string {
  if (!zpid) {
    throw new Error("zpid is required to build property URL");
  }
  const slug = generatePropertySlug(address);
  return `/property/${zpid}/${slug}`;
}

/**
 * Parse zpid from a property URL
 */
export function parsePropertyUrl(url: string): {
  zpid: string;
  slug?: string;
} | null {
  const match = url.match(/\/property\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;

  return {
    zpid: match[1],
    slug: match[2],
  };
}
