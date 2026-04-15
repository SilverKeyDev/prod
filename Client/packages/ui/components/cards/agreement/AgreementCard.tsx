import {
  formatDate,
  formatFilenameToAddress,
} from "packages/features/search/types/search/address";
import { useAuthStore } from "packages/store";
import { getContextualAgreementStatus } from "packages/utils/agreement/contextualAgreementStatus";

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
      return "border-l-4 border-l-yellow-500";
    case "waiting_for_signature":
    case "waiting_for_review":
      return "border-l-4 border-l-brown";
    case "completed":
      return "border-l-4 border-l-green-600";
    case "voided":
    case "declined":
      return "border-l-4 border-l-red-500";
    default:
      return "border-l-4 border-l-gray-300";
  }
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

/** Listing-agent discard will call DocuSign void when the envelope is not completed/voided locally. */
function agentDiscardWillVoidDocusign(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined,
): boolean {
  if (doc.library_kind !== "agreement" || !viewerUserId || !doc.agent_id) {
    return false;
  }
  if (viewerUserId !== doc.agent_id) return false;
  const noVoidCopy = ["completed", "voided"];
  return !noVoidCopy.includes((doc.status ?? "").toLowerCase());
}

/** Buyer: library row only. Agent: always (server voids or strips shared library for client + agent). */
function canDiscardAgreement(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined,
): boolean {
  if (doc.library_kind !== "agreement" || !viewerUserId) {
    return false;
  }
  if (doc.agent_id === viewerUserId) {
    return true;
  }
  return Boolean(doc.library_item_id);
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

  const rawStatus = (
    doc.status ?? ""
  ).toLowerCase() as ContextualAgreementStatus;
  const contextualStatus =
    viewerUserId && doc.participants?.length
      ? getContextualAgreementStatus(doc, viewerUserId, isAgent)
      : rawStatus || "draft";
  const accentBorder = getAccentBorder(contextualStatus);
  const sentToLabel = getSentToLabel(doc, isAgent);
  const deleteVoidsEnvelope = agentDiscardWillVoidDocusign(doc, viewerUserId);
  const isListingAgent = Boolean(
    viewerUserId && doc.agent_id && viewerUserId === doc.agent_id,
  );
  const showDelete =
    showDeleteProp ||
    (Boolean(onDelete) && canDiscardAgreement(doc, viewerUserId));

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
        isListingAgent={isListingAgent}
        externalActionHandlers={externalActionHandlers}
      />
    </BaseCard>
  );
}
