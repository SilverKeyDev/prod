/**
 * URL helpers for agent client hub routes: `/dashboard/client/{nameSlug}/{idSlug}`.
 *
 * `nameSlug` is derived from the client's display name; `idSlug` is the last segment of the
 * client's user id (RFC4122 UUID) for a shorter, shareable path.
 */

import { isLikelyUserUuid } from "packages/utils/agent/pendingPublicAgentConnect";
import { generateAgentProfileSlug } from "packages/utils/agent/slug";

export function generateClientHubNameSlug(displayName: string): string {
  return generateAgentProfileSlug(displayName.trim() || "client");
}

/** Last hyphen-separated segment of a UUID, lowercased; otherwise a sanitized tail of the id. */
export function generateClientHubIdSlug(clientId: string): string {
  const trimmed = clientId.trim();
  if (!trimmed) {
    throw new Error("clientId is required to build client hub id slug");
  }
  if (isLikelyUserUuid(trimmed)) {
    const last = trimmed.split("-").pop();
    return (last ?? trimmed).toLowerCase();
  }
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(-12);
}

export function buildClientHubPath(clientId: string, clientName: string): string {
  const nameSlug = generateClientHubNameSlug(clientName);
  const idSlug = generateClientHubIdSlug(clientId);
  return `/dashboard/client/${nameSlug}/${idSlug}`;
}

export type ParsedClientHubPath = {
  nameSlug: string;
  idSlug: string;
};

const CLIENT_HUB_PATH_RE = /^\/dashboard\/client\/([^/]+)\/([^/]+)\/?$/;

export function parseClientHubPathname(pathname: string): ParsedClientHubPath | null {
  const match = pathname.match(CLIENT_HUB_PATH_RE);
  if (!match) return null;
  const nameSlug = match[1]?.trim() ?? "";
  const idSlug = match[2]?.trim() ?? "";
  if (!nameSlug || !idSlug) return null;
  return { nameSlug, idSlug };
}

export function resolveClientIdFromHubSegments(
  clients: readonly { id: string; name: string }[],
  nameSlug: string,
  idSlug: string
): string | null {
  const normalizedName = nameSlug.trim().toLowerCase();
  const normalizedId = idSlug.trim().toLowerCase();
  if (!normalizedName || !normalizedId) return null;

  const matches = clients.filter((client) => {
    return (
      generateClientHubNameSlug(client.name) === normalizedName &&
      generateClientHubIdSlug(client.id) === normalizedId
    );
  });

  if (matches.length >= 1) {
    return matches[0].id;
  }

  if (isLikelyUserUuid(normalizedId)) {
    const byUuid = clients.find((c) => c.id.trim().toLowerCase() === normalizedId);
    if (byUuid && generateClientHubNameSlug(byUuid.name) === normalizedName) {
      return byUuid.id;
    }
  }

  return null;
}

export function resolveClientHubRouteClientId(
  clients: readonly { id: string; name: string }[],
  parsed: ParsedClientHubPath
): string | null {
  return resolveClientIdFromHubSegments(clients, parsed.nameSlug, parsed.idSlug);
}
