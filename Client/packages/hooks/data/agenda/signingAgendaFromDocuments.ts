/**
 * Pure helpers: derive agenda signing to-dos from document library rows.
 * Shared by useSigningTodos (logged-in user) and client-hub (agent viewing a client).
 */

import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import type { DocumentData } from "packages/features/documents";

export const AGREEMENT_DISPLAY_STATUSES = new Set(["sent", "delivered", "signed", "completed"]);

export function toPendingSigningTodo(doc: {
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

export function toCompletedSigningTodo(doc: {
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

function isViewerSigned(doc: DocumentData, viewerUserId: string): boolean {
  const viewerParticipant = doc.participants?.find((p) => p.user_id === viewerUserId);
  return (
    viewerParticipant?.recipient_status === "signed" ||
    viewerParticipant?.recipient_status === "completed"
  );
}

/** Client (or agent hub emulating client): agreements awaiting this user's signature. */
export function pendingSigningAgendaTodosAsClient(
  documents: DocumentData[],
  viewerUserId: string
): AgendaTodoDTO[] {
  if (!viewerUserId || !documents.length) return [];

  return documents
    .filter((doc) => {
      if (doc.library_kind !== "agreement") return false;

      const status = (doc.status ?? "").toLowerCase();
      if (!AGREEMENT_DISPLAY_STATUSES.has(status)) {
        return false;
      }

      if (!doc.participants?.length) return false;

      if (isViewerSigned(doc, viewerUserId)) return false;

      return true;
    })
    .map((doc) =>
      toPendingSigningTodo({
        id: doc.id,
        filename: doc.filename,
        address: doc.address,
      })
    );
}

/** Agent dashboard: show signing to-do when the client has signed and the agent has not. */
export function pendingSigningAgendaTodosAsAgent(
  documents: DocumentData[],
  agentUserId: string
): AgendaTodoDTO[] {
  if (!agentUserId || !documents.length) return [];

  return documents
    .filter((doc) => {
      if (doc.library_kind !== "agreement") return false;

      const status = (doc.status ?? "").toLowerCase();
      if (!AGREEMENT_DISPLAY_STATUSES.has(status)) {
        return false;
      }

      if (!doc.participants?.length) return false;

      if (isViewerSigned(doc, agentUserId)) return false;

      const clientParticipant = doc.participants.find(
        (p) => p.user_id === doc.buyer_id && p.user_id !== agentUserId
      );
      const clientSigned =
        clientParticipant?.recipient_status === "signed" ||
        clientParticipant?.recipient_status === "completed";
      return clientSigned;
    })
    .map((doc) =>
      toPendingSigningTodo({
        id: doc.id,
        filename: doc.filename,
        address: doc.address,
      })
    );
}

/** Agreements this viewer has already signed (full agenda modal / completed list). */
export function completedSigningAgendaTodosForViewer(
  documents: DocumentData[],
  viewerUserId: string
): AgendaTodoDTO[] {
  if (!viewerUserId || !documents.length) return [];

  return documents
    .filter((doc) => {
      if (doc.library_kind !== "agreement") return false;

      const status = (doc.status ?? "").toLowerCase();
      if (!AGREEMENT_DISPLAY_STATUSES.has(status)) {
        return false;
      }

      if (!doc.participants?.length) return false;

      return isViewerSigned(doc, viewerUserId);
    })
    .map((doc) =>
      toCompletedSigningTodo({
        id: doc.id,
        filename: doc.filename,
        address: doc.address,
        updated_at: doc.updated_at,
        created_at: doc.created_at,
      })
    );
}
