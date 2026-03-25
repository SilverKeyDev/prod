import type { AgentIdRaw } from "packages/features/messaging/types/agentId";

export type { AgentIdRaw } from "packages/features/messaging/types/agentId";

export function resolvePrimaryAgentId(raw: AgentIdRaw): string | null {
  if (!raw) {
    return null;
  }

  let id: string | undefined;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      id = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      id = raw.split(",")[0]?.trim();
    }
  } else if (Array.isArray(raw)) {
    id = raw[0];
  }

  return id ?? null;
}
