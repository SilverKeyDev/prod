/**
 * Viewer-aware agreement lifecycle labels for library cards and signing entry points.
 * Sequential DocuSign routing uses participant `routing_order`.
 */

export type ContextualAgreementStatus =
  | "sign_now"
  | "waiting_for_signature"
  | "waiting_for_review"
  | "draft"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "voided"
  | "declined";

/** Minimal agreement shape for contextual signing status (library, modals, lists). */
export type AgreementLikeForContext = {
  status: string;
  participants?: Array<{
    user_id?: string | null;
    role?: string | null;
    routing_order?: number | null;
    recipient_status?: string | null;
  }>;
  buyer_id?: string | null;
};

function participantRecipientSigned(
  recipientStatus: string | null | undefined,
): boolean {
  const s = (recipientStatus ?? "").toLowerCase();
  return s === "signed" || s === "completed";
}

/**
 * First signer by DocuSign routing order who has not yet completed signing.
 */
export function getNextSignerUserId(
  participants: NonNullable<AgreementLikeForContext["participants"]>,
): string | null {
  const signers = participants
    .filter((p) => p.role === "signer" && p.user_id)
    .sort((a, b) => {
      const ao = a.routing_order ?? 999;
      const bo = b.routing_order ?? 999;
      if (ao !== bo) return ao - bo;
      return String(a.user_id).localeCompare(String(b.user_id));
    });
  const next = signers.find(
    (p) => !participantRecipientSigned(p.recipient_status),
  );
  return next?.user_id ?? null;
}

/**
 * Derive contextual status for the current user. Only the current routing recipient
 * receives `sign_now`; others waiting on an earlier signer get `waiting_for_signature`.
 */
export function getContextualAgreementStatus(
  agreement: AgreementLikeForContext,
  viewerUserId: string,
  _isAgent: boolean,
): ContextualAgreementStatus {
  const status = String(agreement.status ?? "").toLowerCase();

  if (
    status === "completed" ||
    status === "voided" ||
    status === "declined" ||
    status === "draft"
  ) {
    return status;
  }

  if (!agreement.participants?.length)
    return status as ContextualAgreementStatus;

  const viewerParticipant = agreement.participants.find(
    (p) => p.user_id === viewerUserId,
  );
  const viewerIsSigner = viewerParticipant?.role === "signer";
  const viewerSigned =
    viewerIsSigner &&
    participantRecipientSigned(viewerParticipant?.recipient_status);

  if (status === "sent" || status === "delivered" || status === "signed") {
    if (!viewerIsSigner) {
      return "waiting_for_signature";
    }
    if (viewerSigned) {
      return "waiting_for_review";
    }
    const currentSignerId = getNextSignerUserId(agreement.participants);
    if (currentSignerId === viewerUserId) {
      return "sign_now";
    }
    return "waiting_for_signature";
  }

  return status as ContextualAgreementStatus;
}
