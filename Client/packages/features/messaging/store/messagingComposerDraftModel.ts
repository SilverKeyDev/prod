/** Pure draft map updates for messaging composer (testable without Zustand). */

export function mergeDraft(
  draftByConversationId: Record<string, string>,
  conversationId: string,
  text: string
): Record<string, string> | null {
  const prev = draftByConversationId[conversationId] ?? "";
  if (prev === text) return null;
  return { ...draftByConversationId, [conversationId]: text };
}

export function removeDraftKey(
  draftByConversationId: Record<string, string>,
  conversationId: string
): Record<string, string> | null {
  if (!(conversationId in draftByConversationId)) return null;
  const { [conversationId]: _removed, ...rest } = draftByConversationId;
  return rest;
}
