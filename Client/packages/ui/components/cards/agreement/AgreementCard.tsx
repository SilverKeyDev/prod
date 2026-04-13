import {
  formatDate,
  formatFilenameToAddress,
} from "packages/features/search/types/search/address";
import { useAuthStore } from "packages/store";

import BaseCard from "@/components/cards/BaseCard";
import { extractReportTitleFromPath } from "@/features/documents/utils/nameScrub";

import AgreementCardActions from "./AgreementCardActions";
import AgreementCardHeader from "./AgreementCardHeader";
import type { AgreementCardProps, ContextualAgreementStatus } from "./types";

export type { AgreementCardProps, AgreementData } from "./types";

/**
 * Compute the left-border accent colour based on contextual status.
 */
function getAccentBorder(status: ContextualAgreementStatus): string {
  switch (status) {
    case "sign_now":
      return "border-l-4 border-l-amber-500";
    case "waiting_for_signature":
      return "border-l-4 border-l-blue-500";
    case "waiting_for_review":
      return "border-l-4 border-l-indigo-500";
    case "completed":
      return "border-l-4 border-l-green-500";
    case "voided":
    case "declined":
      return "border-l-4 border-l-red-400";
    default:
      return "border-l-4 border-l-gray-300";
  }
}

/**
 * Derive the viewer-aware contextual status from agreement + participant data.
 */
function getContextualStatus(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined,
  isAgent: boolean,
): ContextualAgreementStatus {
  const status = (doc.status ?? "").toLowerCase();

  // Terminal states pass through unchanged
  if (
    status === "completed" ||
    status === "voided" ||
    status === "declined" ||
    status === "draft"
  ) {
    return status as ContextualAgreementStatus;
  }

  if (!viewerUserId || !doc.participants?.length) {
    return (status as ContextualAgreementStatus) || "draft";
  }

  const viewerParticipant = doc.participants.find(
    (p) => p.user_id === viewerUserId,
  );
  const viewerHasSigned =
    viewerParticipant?.recipient_status === "signed" ||
    viewerParticipant?.recipient_status === "completed";

  // Envelope is active (sent / delivered / signed)
  if (status === "sent" || status === "delivered" || status === "signed") {
    if (isAgent) {
      // Agent: check if client has signed
      const clientParticipant = doc.participants.find(
        (p) => p.user_id === doc.buyer_id && p.user_id !== viewerUserId,
      );
      const clientHasSigned =
        clientParticipant?.recipient_status === "signed" ||
        clientParticipant?.recipient_status === "completed";

      if (clientHasSigned && !viewerHasSigned) return "sign_now";
      if (!clientHasSigned) return "waiting_for_signature";
    } else {
      // Client: check if they need to sign
      if (!viewerHasSigned) return "sign_now";
      return "waiting_for_review";
    }
  }

  return (status as ContextualAgreementStatus) || "draft";
}

function getSentToLabel(
  doc: AgreementCardProps["doc"],
  isAgent: boolean,
): string | null {
  if (!isAgent || !doc.buyer_id) return null;
  const buyer = doc.participants?.find((p) => p.user_id === doc.buyer_id);
  if (buyer?.name?.trim()) return buyer.name.trim();
  if (buyer?.email?.trim()) return buyer.email.trim();
  return "Client";
}

function canVoidAgreementAsSender(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined,
): boolean {
  if (doc.library_kind !== "agreement" || !viewerUserId || !doc.agent_id) {
    return false;
  }
  if (viewerUserId !== doc.agent_id) return false;
  const terminal = ["completed", "voided", "declined"];
  return !terminal.includes((doc.status ?? "").toLowerCase());
}

/**
 * Agreement card with distinct visual identity from DocumentCard.
 * Uses the same BaseCard foundation (same height) with a coloured left accent,
 * prominent contextual status badge, and adaptive action buttons.
 */
export default function AgreementCard({
  doc,
  onDelete,
  showDelete: showDeleteProp = false,
  externalActionHandlers,
  viewerUserId: viewerUserIdProp,
  isAgent: isAgentProp,
}: AgreementCardProps) {
  const currentUser = useAuthStore((s) => s.user);
  const viewerUserId = viewerUserIdProp ?? currentUser?.id;
  const isAgent = isAgentProp ?? viewerUserId === doc.agent_id;

  const contextualStatus = getContextualStatus(doc, viewerUserId, isAgent);
  const accentBorder = getAccentBorder(contextualStatus);
  const sentToLabel = getSentToLabel(doc, isAgent);
  const deleteVoidsEnvelope = canVoidAgreementAsSender(doc, viewerUserId);
  const showDelete =
    showDeleteProp || (Boolean(onDelete) && deleteVoidsEnvelope);

  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  const formattedDate = doc.created_at ? formatDate(doc.created_at) : "Unknown";

  // Count signers and how many have signed
  const signers = (doc.participants ?? []).filter((p) => p.role === "signer");
  const signedCount = signers.filter(
    (p) =>
      p.recipient_status === "signed" || p.recipient_status === "completed",
  ).length;

  return (
    <BaseCard
      variant="default"
      padding="md"
      rounded="lg"
      shadow="sm"
      hover
      cardType="searchpage"
      scale="md"
      width="full"
      background="white"
      className={accentBorder}
    >
      <AgreementCardHeader
        title={baseName}
        contextualStatus={contextualStatus}
        signedCount={signedCount}
        totalSigners={signers.length}
        uploadedDate={formattedDate}
        sentToLabel={sentToLabel}
      />

      <AgreementCardActions
        doc={doc}
        contextualStatus={contextualStatus}
        onDelete={onDelete}
        showDelete={showDelete}
        deleteVoidsEnvelope={deleteVoidsEnvelope}
        externalActionHandlers={externalActionHandlers}
      />
    </BaseCard>
  );
}
