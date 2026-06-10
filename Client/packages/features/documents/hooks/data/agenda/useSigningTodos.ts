/**
 * Derives DocuSign "Sign Now" to-do items from the user's document library.
 *
 * Returns AgendaTodoDTO-compatible items that can be merged into the
 * dashboard agenda alongside regular to-dos and calendar events.
 */

import { useMemo } from "react";

import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import { useDocumentsData } from "packages/features/documents";
import { useAuthStore } from "packages/store";

import {
  completedSigningAgendaTodosForViewer,
  pendingSigningAgendaTodosAsAgent,
  pendingSigningAgendaTodosAsClient,
} from "./signingAgendaFromDocuments";

export function useSigningTodos(isAgent: boolean): AgendaTodoDTO[] {
  const { documents } = useDocumentsData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    if (!currentUserId || !documents.length) return [];
    return isAgent
      ? pendingSigningAgendaTodosAsAgent(documents, currentUserId)
      : pendingSigningAgendaTodosAsClient(documents, currentUserId);
  }, [documents, currentUserId, isAgent]);
}

/**
 * DocuSign agreements the current user has already signed — for the full agenda modal only
 * (excluded from the today preview via `completed` flag).
 */
export function useCompletedSigningTodos(): AgendaTodoDTO[] {
  const { documents } = useDocumentsData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    if (!currentUserId || !documents.length) return [];
    return completedSigningAgendaTodosForViewer(documents, currentUserId);
  }, [documents, currentUserId]);
}
