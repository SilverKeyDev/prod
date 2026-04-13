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

const AGREEMENT_DISPLAY_STATUSES = new Set([
  "sent",
  "delivered",
  "signed",
  "completed",
]);

function toPendingSigningTodo(doc: {
  id: string;
  filename: string;
  address: string | null;
}): AgendaTodoDTO {
  return {
    id: `signing-${doc.id}`,
    title: doc.filename || doc.address || "Agreement",
    due_date: null,
    completed: false,
    agenda_item_kind: "signing",
    signing_agreement_id: doc.id,
  };
}

function toCompletedSigningTodo(doc: {
  id: string;
  filename: string;
  address: string | null;
  updated_at: string | null;
  created_at: string | null;
}): AgendaTodoDTO {
  const completedAt = doc.updated_at ?? doc.created_at ?? null;
  return {
    id: `signing-done-${doc.id}`,
    title: doc.filename || doc.address || "Agreement",
    due_date: null,
    completed: true,
    agenda_item_kind: "signing",
    signing_agreement_id: doc.id,
    signing_completed_at: completedAt,
  };
}

export function useSigningTodos(isAgent: boolean): AgendaTodoDTO[] {
  const { documents } = useDocumentsData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    if (!currentUserId || !documents.length) return [];

    return documents
      .filter((doc) => {
        if (doc.library_kind !== "agreement") return false;

        const status = (doc.status ?? "").toLowerCase();
        if (!AGREEMENT_DISPLAY_STATUSES.has(status)) {
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
      .map((doc) => toPendingSigningTodo(doc));
  }, [documents, currentUserId, isAgent]);
}

/**
 * DocuSign agreements the current user has already signed — for the full agenda modal only * (excluded from the week-ahead card via `completed` flag).
 */
export function useCompletedSigningTodos(): AgendaTodoDTO[] {
  const { documents } = useDocumentsData();
  const currentUserId = useAuthStore((s) => s.user?.id);

  return useMemo(() => {
    if (!currentUserId || !documents.length) return [];

    return documents
      .filter((doc) => {
        if (doc.library_kind !== "agreement") return false;

        const status = (doc.status ?? "").toLowerCase();
        if (!AGREEMENT_DISPLAY_STATUSES.has(status)) {
          return false;
        }

        if (!doc.participants?.length) return false;

        const viewerParticipant = doc.participants.find(
          (p) => p.user_id === currentUserId,
        );
        const viewerSigned =
          viewerParticipant?.recipient_status === "signed" ||
          viewerParticipant?.recipient_status === "completed";

        if (!viewerSigned) return false;

        return true;
      })
      .map((doc) => toCompletedSigningTodo(doc));
  }, [documents, currentUserId]);
}
