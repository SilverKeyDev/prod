import type { AgentClient, AgentConversation } from "packages/api";
import { dateParseISO } from "packages/utils/core/date";

import {
  clientActionSortTier,
  type ClientListActionInput,
} from "@/features/agent/utils/clientList/clientListActionPriority";

export type AgentClientSortMode = "recent" | "name" | "stage";

export type AgentClientActionResolver = (client: AgentClient) => ClientListActionInput;

/** Subset of conversation fields used for recency sorting (web + native). */
export type AgentClientSortConversation = Pick<
  AgentConversation,
  "last_message_at" | "updated_at" | "last_message"
>;

const PIPELINE_ORDER = [
  "search",
  "offer",
  "escrow",
  "financing",
  "closing",
  "insurance",
  "unknown",
] as const;

/** Sort key for pipeline order (search first). */
export function pipelineStageSortIndex(stage: string | null | undefined): number {
  const s = stage ?? "search";
  const idx = PIPELINE_ORDER.indexOf(s as (typeof PIPELINE_ORDER)[number]);
  return idx === -1 ? 0 : idx;
}

function conversationRecencyMs(conv: AgentClientSortConversation | undefined): number {
  if (!conv) return 0;
  const raw = conv.last_message_at ?? conv.updated_at;
  if (!raw) return 0;
  return dateParseISO(raw).valueOf();
}

function compareByMode(
  a: AgentClient,
  b: AgentClient,
  mode: AgentClientSortMode,
  conversationByClientId: Map<string, AgentClientSortConversation>
): number {
  if (mode === "name") {
    return (a.name || a.email || "").localeCompare(b.name || b.email || "", undefined, {
      sensitivity: "base",
    });
  }
  if (mode === "stage") {
    const phaseA = a.current_phase ?? a.pipeline_stage;
    const phaseB = b.current_phase ?? b.pipeline_stage;
    const cmp = pipelineStageSortIndex(phaseA) - pipelineStageSortIndex(phaseB);
    if (cmp !== 0) return cmp;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  }
  const tb = conversationRecencyMs(conversationByClientId.get(b.id));
  const ta = conversationRecencyMs(conversationByClientId.get(a.id));
  if (tb !== ta) return tb - ta;
  return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
}

export function sortAgentClients(
  clients: AgentClient[],
  mode: AgentClientSortMode,
  conversationByClientId: Map<string, AgentClientSortConversation>,
  getAction?: AgentClientActionResolver
): AgentClient[] {
  const out = [...clients];
  out.sort((a, b) => {
    if (getAction) {
      const tierA = clientActionSortTier(getAction(a));
      const tierB = clientActionSortTier(getAction(b));
      if (tierA !== tierB) return tierA - tierB;
    }
    return compareByMode(a, b, mode, conversationByClientId);
  });
  return out;
}
