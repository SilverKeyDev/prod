/**
 * URL helpers for agent client hub routes: `/dashboard/client/{nameSlug}/{idSlug}`.
 *
 * `nameSlug` is derived from the client's display name; `idSlug` is the last segment of the
 * client's user id (RFC4122 UUID) for a shorter, shareable path. Legacy `/dashboard/client/{uuid}`
 * URLs are still accepted and canonicalized to the two-segment form.
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

export type ParsedClientHubPath =
  | { kind: "segments"; nameSlug: string; idSlug: string }
  | { kind: "legacy"; segment: string };

const CLIENT_HUB_PATH_RE = /^\/dashboard\/client\/([^/]+)(?:\/([^/]+))?\/?$/;

export function parseClientHubPathname(pathname: string): ParsedClientHubPath | null {
  const match = pathname.match(CLIENT_HUB_PATH_RE);
  if (!match) return null;
  const first = match[1]?.trim() ?? "";
  const second = match[2]?.trim() ?? "";
  if (!first) return null;
  if (second) {
    return { kind: "segments", nameSlug: first, idSlug: second };
  }
  return { kind: "legacy", segment: first };
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

export function resolveClientIdFromLegacyHubSegment(
  clients: readonly { id: string; name: string }[],
  segment: string
): string | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;
  if (!isLikelyUserUuid(trimmed)) return null;
  const found = clients.find((c) => c.id.trim() === trimmed);
  return found?.id ?? trimmed;
}

export function resolveClientHubRouteClientId(
  clients: readonly { id: string; name: string }[],
  parsed: ParsedClientHubPath
): string | null {
  if (parsed.kind === "legacy") {
    return resolveClientIdFromLegacyHubSegment(clients, parsed.segment);
  }
  return resolveClientIdFromHubSegments(clients, parsed.nameSlug, parsed.idSlug);
}
