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

export function useSigningTodos(isAgent: boolean): AgendaTodoDTO[] {
  const { documents } = useDocumentsData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    if (!currentUserId || !documents.length) return [];

    return documents
      .filter((doc) => {
        if (doc.library_kind !== "agreement") return false;

        const status = (doc.status ?? "").toLowerCase();
        if (
          status !== "sent" &&
          status !== "delivered" &&
          status !== "signed"
        ) {
          return false;
        }

        if (!doc.participants?.length) return false;

        const viewerParticipant = doc.participants.find(
          (p) => p.user_id === currentUserId,
        );
        const viewerSigned =
          viewerParticipant?.recipient_status === "signed" ||
          viewerParticipant?.recipient_status === "completed";

        if (viewerSigned) return false;

        if (isAgent) {
          const clientParticipant = doc.participants.find(
            (p) => p.user_id === doc.buyer_id && p.user_id !== currentUserId,
          );
          const clientSigned =
            clientParticipant?.recipient_status === "signed" ||
            clientParticipant?.recipient_status === "completed";
          return clientSigned;
        }

        return true;
      })
      .map((doc) => ({
        id: `signing-${doc.id}`,
        title: `Sign: ${doc.filename || doc.address || "Agreement"}`,
        due_date: null,
        completed: false,
      }));
  }, [documents, currentUserId, isAgent]);
}
