import { getSessionStorage } from "packages/utils/storage/platformStorage";

export const PENDING_PUBLIC_AGENT_CONNECT_KEY = "silverkey_pending_public_agent_connect_v1";

const RFC4122_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLikelyUserUuid(value: string): boolean {
  return RFC4122_UUID.test(value.trim());
}

function normalizeAgentUserId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!isLikelyUserUuid(trimmed)) return null;
  return trimmed;
}

export function setPendingPublicAgentConnect(agentUserId: string): void {
  const normalized = normalizeAgentUserId(agentUserId);
  if (!normalized) return;
  getSessionStorage().setItem(PENDING_PUBLIC_AGENT_CONNECT_KEY, normalized);
}

export function peekPendingPublicAgentConnect(): string | null {
  const raw = getSessionStorage().getItem(PENDING_PUBLIC_AGENT_CONNECT_KEY);
  if (raw == null || raw === "") return null;
  return normalizeAgentUserId(raw);
}

export function clearPendingPublicAgentConnect(): void {
  getSessionStorage().removeItem(PENDING_PUBLIC_AGENT_CONNECT_KEY);
}
