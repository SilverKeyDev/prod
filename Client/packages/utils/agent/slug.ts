/**
 * URL-safe slug and path helpers for public agent profile share links.
 */

export function generateAgentProfileSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function buildAgentProfileUrl(agentId: string, displayName: string): string {
  const id = agentId.trim();
  if (!id) {
    throw new Error("agentId is required to build agent profile URL");
  }
  const slug = generateAgentProfileSlug(displayName.trim() || "agent");
  return `/agent-profile/${id}/${slug}`;
}

export function parseAgentProfileUrl(url: string): {
  agentId: string;
  slug?: string;
} | null {
  const match = url.match(/\/agent-profile\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;
  return {
    agentId: match[1],
    slug: match[2],
  };
}
