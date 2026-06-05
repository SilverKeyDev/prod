import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

export const PENDING_PUBLIC_AGENT_CONNECT_KEY = "silverkey_pending_public_agent_connect_v1";

const RFC4122_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PendingAgentConnectMeta = {
  id: string;
  name?: string;
  photoUrl?: string;
};

export function isLikelyUserUuid(value: string): boolean {
  return RFC4122_UUID.test(value.trim());
}

function normalizeAgentUserId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!isLikelyUserUuid(trimmed)) return null;
  return trimmed;
}

function parseStoredMeta(raw: string): PendingAgentConnectMeta | null {
  const trimmed = raw.trim();
  // Legacy format: bare UUID string
  if (isLikelyUserUuid(trimmed)) {
    return { id: trimmed };
  }
  // New format: JSON object
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "id" in parsed &&
      typeof (parsed as { id: unknown }).id === "string" &&
      isLikelyUserUuid((parsed as { id: string }).id)
    ) {
      const { id, name, photoUrl } = parsed as {
        id: string;
        name?: unknown;
        photoUrl?: unknown;
      };
      return {
        id,
        name: typeof name === "string" && name.trim() ? name.trim() : undefined,
        photoUrl: typeof photoUrl === "string" && photoUrl.trim() ? photoUrl.trim() : undefined,
      };
    }
  } catch {
    // not valid JSON
  }
  return null;
}

export function setPendingPublicAgentConnect(
  agentUserId: string,
  meta?: { name?: string; photoUrl?: string }
): void {
  const normalized = normalizeAgentUserId(agentUserId);
  if (!normalized) return;
  const record: PendingAgentConnectMeta = {
    id: normalized,
    ...(meta?.name?.trim() ? { name: meta.name.trim() } : {}),
    ...(meta?.photoUrl?.trim() ? { photoUrl: meta.photoUrl.trim() } : {}),
  };
  getSessionStorage().setItem(PENDING_PUBLIC_AGENT_CONNECT_KEY, JSON.stringify(record));
}

export function peekPendingPublicAgentConnect(): string | null {
  const raw = getSessionStorage().getItem(PENDING_PUBLIC_AGENT_CONNECT_KEY);
  if (raw == null || raw === "") return null;
  const meta = parseStoredMeta(raw);
  return meta?.id ?? null;
}

export function getPendingPublicAgentConnectMeta(): PendingAgentConnectMeta | null {
  const raw = getSessionStorage().getItem(PENDING_PUBLIC_AGENT_CONNECT_KEY);
  if (raw == null || raw === "") return null;
  return parseStoredMeta(raw);
}

export function clearPendingPublicAgentConnect(): void {
  getSessionStorage().removeItem(PENDING_PUBLIC_AGENT_CONNECT_KEY);
}
