import type { AgentConversation } from "packages/api";
import { dateParseISO } from "packages/utils/core/date";

export function compareConversationsByRecency(a: AgentConversation, b: AgentConversation): number {
  const taRaw = a.last_message_at ?? a.updated_at;
  const tbRaw = b.last_message_at ?? b.updated_at;
  if (!taRaw && !tbRaw) return 0;
  if (!taRaw) return 1;
  if (!tbRaw) return -1;
  return dateParseISO(tbRaw).valueOf() - dateParseISO(taRaw).valueOf();
}
