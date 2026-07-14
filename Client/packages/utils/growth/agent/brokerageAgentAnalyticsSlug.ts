/**
 * URL helpers for brokerage agent analytics routes: `/dashboard/agent/{nameSlug}`.
 *
 * Unlike client hub (two segments), agent analytics uses only the name slug for readability.
 * Legacy agent-N IDs are supported for redirect compatibility.
 */

import { generateAgentProfileSlug } from "./slug";

export function buildBrokerageAgentAnalyticsPath(agentId: string, agentName: string): string {
  const nameSlug = generateAgentProfileSlug(agentName.trim() || "agent");
  return `/dashboard/agent/${encodeURIComponent(nameSlug)}`;
}

export function resolveBrokerageAgentIdFromSlug(
  agents: readonly { id: string; name: string }[],
  slug: string
): string | null {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  // Check for legacy agent-N format for backward compatibility
  const legacyMatch = normalizedSlug.match(/^agent-(\d+)$/);
  if (legacyMatch) {
    const legacyAgent = agents.find((agent) => agent.id === normalizedSlug);
    if (legacyAgent) return legacyAgent.id;
  }

  // Look up by name slug
  const matches = agents.filter((agent) => {
    const agentSlug = generateAgentProfileSlug(agent.name);
    return agentSlug === normalizedSlug;
  });

  if (matches.length >= 1) {
    return matches[0].id;
  }

  return null;
}

export function getCanonicalAgentSlug(agentName: string): string {
  return generateAgentProfileSlug(agentName.trim() || "agent");
}

export function isLegacyAgentId(slug: string): boolean {
  return /^agent-\d+$/.test(slug.trim().toLowerCase());
}
