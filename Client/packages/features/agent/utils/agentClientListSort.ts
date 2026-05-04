import type { AgentClient, AgentConversation } from "packages/api";
import { dateParseISO } from "packages/utils/date";

export type AgentClientSortMode = "recent" | "name" | "stage";

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

export function sortAgentClients(
  clients: AgentClient[],
  mode: AgentClientSortMode,
  conversationByClientId: Map<string, AgentClientSortConversation>
): AgentClient[] {
  const out = [...clients];
  if (mode === "name") {
    out.sort((a, b) =>
      (a.name || a.email || "").localeCompare(b.name || b.email || "", undefined, {
        sensitivity: "base",
      })
    );
    return out;
  }
  if (mode === "stage") {
    out.sort((a, b) => {
      const cmp =
        pipelineStageSortIndex(a.pipeline_stage) - pipelineStageSortIndex(b.pipeline_stage);
      if (cmp !== 0) return cmp;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
    return out;
  }
  out.sort((a, b) => {
    const tb = conversationRecencyMs(conversationByClientId.get(b.id));
    const ta = conversationRecencyMs(conversationByClientId.get(a.id));
    if (tb !== ta) return tb - ta;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
  return out;
}
