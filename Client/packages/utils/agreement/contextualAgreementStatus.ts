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
    email?: string | null;
    role?: string | null;
    routing_order?: number | null;
    recipient_status?: string | null;
  }>;
  buyer_id?: string | null;
};

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function hasParticipantIdentity(p: { user_id?: string | null; email?: string | null }): boolean {
  const uid = (p.user_id ?? "").trim();
  return uid.length > 0 || normalizeEmail(p.email) != null;
}

function participantMatchesViewer(
  p: NonNullable<AgreementLikeForContext["participants"]>[number],
  viewerUserId: string,
  viewerEmailNorm: string | null
): boolean {
  const uid = (p.user_id ?? "").trim();
  if (uid.length > 0 && uid === viewerUserId) {
    return true;
  }
  const pe = normalizeEmail(p.email);
  if (viewerEmailNorm != null && pe != null && pe === viewerEmailNorm) {
    return true;
  }
  return false;
}

function isSignerRole(role: string | null | undefined): boolean {
  return String(role ?? "").toLowerCase() === "signer";
}

function participantRecipientSigned(recipientStatus: string | null | undefined): boolean {
  const s = (recipientStatus ?? "").toLowerCase();
  return s === "signed" || s === "completed";
}

type SignerParticipant = NonNullable<AgreementLikeForContext["participants"]>[number];

function getOrderedSignerParticipants(
  participants: NonNullable<AgreementLikeForContext["participants"]>
): SignerParticipant[] {
  return participants
    .filter((p) => isSignerRole(p.role) && hasParticipantIdentity(p))
    .sort((a, b) => {
      const ao = a.routing_order ?? 999;
      const bo = b.routing_order ?? 999;
      if (ao !== bo) return ao - bo;
      const ak = `${(a.user_id ?? "").trim()}\0${normalizeEmail(a.email) ?? ""}`;
      const bk = `${(b.user_id ?? "").trim()}\0${normalizeEmail(b.email) ?? ""}`;
      return ak.localeCompare(bk);
    });
}

function getNextUnsignedSigner(
  participants: NonNullable<AgreementLikeForContext["participants"]>
): SignerParticipant | null {
  const signers = getOrderedSignerParticipants(participants);
  return signers.find((p) => !participantRecipientSigned(p.recipient_status)) ?? null;
}

/**
 * First signer by DocuSign routing order who has not yet completed signing.
 * Returns that participant's SilverKey `user_id` when present; otherwise `null`
 * (e.g. recipient matched only by email until linked).
 */
export function getNextSignerUserId(
  participants: NonNullable<AgreementLikeForContext["participants"]>
): string | null {
  const next = getNextUnsignedSigner(participants);
  if (!next) return null;
  const uid = (next.user_id ?? "").trim();
  return uid.length > 0 ? uid : null;
}

/**
 * Derive contextual status for the current user. Only the current routing recipient
 * receives `sign_now`; others waiting on an earlier signer get `waiting_for_signature`.
 *
 * @param viewerEmail - Optional viewer email; when DocuSign rows are not yet linked to
 *   `user_id`, matching by email still yields correct `sign_now` (same as detail modal).
 */
export function getContextualAgreementStatus(
  agreement: AgreementLikeForContext,
  viewerUserId: string,
  _isAgent: boolean,
  viewerEmail?: string | null
): ContextualAgreementStatus {
  const status = String(agreement.status ?? "").toLowerCase();
  const viewerEmailNorm = normalizeEmail(viewerEmail);

  if (
    status === "completed" ||
    status === "voided" ||
    status === "declined" ||
    status === "draft"
  ) {
    return status;
  }

  if (!agreement.participants?.length) return status as ContextualAgreementStatus;

  const viewerParticipant = agreement.participants.find((p) =>
    participantMatchesViewer(p, viewerUserId, viewerEmailNorm)
  );
  const viewerIsSigner = viewerParticipant ? isSignerRole(viewerParticipant.role) : false;
  const viewerSigned =
    viewerIsSigner && participantRecipientSigned(viewerParticipant?.recipient_status);

  if (status === "sent" || status === "delivered" || status === "signed") {
    if (!viewerIsSigner) {
      return "waiting_for_signature";
    }
    if (viewerSigned) {
      return "waiting_for_review";
    }
    const nextSigner = getNextUnsignedSigner(agreement.participants);
    if (nextSigner && participantMatchesViewer(nextSigner, viewerUserId, viewerEmailNorm)) {
      return "sign_now";
    }
    return "waiting_for_signature";
  }

  return status as ContextualAgreementStatus;
}
