import { Icon } from "@ui/icons";

import {
  formatDate,
  formatFilenameToAddress,
} from "packages/features/search/types/search/formatters/address";
import { useAuthStore } from "packages/store";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { AgendaListItemShell } from "packages/ui/components/surfaces/patterns/AgendaListItemShell";
import { agreementAgendaAccentBarClass } from "packages/utils/transaction/agreement/agreementAgendaAccentBar";
import { getContextualAgreementStatus } from "packages/utils/transaction/agreement/contextualAgreementStatus";
import { extractReportTitleFromPath } from "packages/utils/transaction/documents";

import { BodyText } from "@/components/ui";

import AgreementCardActions from "./AgreementCardActions";
import { AGREEMENT_CONTEXTUAL_STATUS_BADGE } from "./agreementContextualStatusBadge";
import type { AgreementCardProps, ContextualAgreementStatus } from "./types";

function getSentToLabel(doc: AgreementCardProps["doc"], isAgent: boolean): string | null {
  if (!isAgent || !doc.buyer_id) return null;
  const buyer = doc.participants?.find((p) => p.user_id === doc.buyer_id);
  if (buyer?.name?.trim()) return buyer.name.trim();
  if (buyer?.email?.trim()) return buyer.email.trim();
  return "Client";
}

function agentDiscardWillVoidDocusign(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined
): boolean {
  if (doc.library_kind !== "agreement" || !viewerUserId || !doc.agent_id) {
    return false;
  }
  if (viewerUserId !== doc.agent_id) return false;
  const noVoidCopy = ["completed", "voided"];
  return !noVoidCopy.includes((doc.status ?? "").toLowerCase());
}

function canDiscardAgreement(
  doc: AgreementCardProps["doc"],
  viewerUserId: string | undefined
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
 * Library list / agenda-style row for DocuSign agreements: compact header + full AgreementCardActions.
 */
export default function AgreementListRow({
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

  const rawStatus = (doc.status ?? "").toLowerCase() as ContextualAgreementStatus;
  const contextualStatus =
    viewerUserId && doc.participants?.length
      ? getContextualAgreementStatus(doc, viewerUserId, isAgent, currentUser?.email)
      : rawStatus || "draft";

  const accentBar = agreementAgendaAccentBarClass(contextualStatus);
  const badge =
    AGREEMENT_CONTEXTUAL_STATUS_BADGE[contextualStatus] ?? AGREEMENT_CONTEXTUAL_STATUS_BADGE.draft;
  const sentToLabel = getSentToLabel(doc, isAgent);
  const deleteVoidsEnvelope = agentDiscardWillVoidDocusign(doc, viewerUserId);
  const isListingAgent = Boolean(viewerUserId && doc.agent_id && viewerUserId === doc.agent_id);
  const showDelete =
    showDeleteProp || (Boolean(onDelete) && canDiscardAgreement(doc, viewerUserId));

  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  const formattedDate = doc.created_at ? formatDate(doc.created_at) : "Unknown";

  const signers = (doc.participants ?? []).filter((p) => p.role === "signer");
  const signedCount = signers.filter(
    (p) => p.recipient_status === "signed" || p.recipient_status === "completed"
  ).length;
  const totalSigners = signers.length;

  const iconTileClassName =
    "border-border-card-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border bg-gray-100";

  const header = (
    <>
      <Box className="flex flex-shrink-0 flex-col items-center gap-2">
        <BodyText
          size="xs"
          className={`inline-flex items-center justify-center text-center leading-tight ${badge.className} rounded-full border px-2 py-0.5 font-semibold`}
        >
          {badge.label}
        </BodyText>
        <Box className={iconTileClassName}>
          <Icon name="file-signature" size={18} className="text-gray-600" />
        </Box>
      </Box>
      <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Text className="text-text-primary min-w-0 text-left text-sm font-semibold leading-snug">
          {baseName}
        </Text>
        {totalSigners > 0 ? (
          <Text className="text-text-secondary text-left text-xs leading-relaxed">
            {signedCount} of {totalSigners} signed
          </Text>
        ) : null}
        {sentToLabel ? (
          <Text className="text-text-secondary text-left text-xs leading-relaxed">
            Sent to: {sentToLabel}
          </Text>
        ) : null}
        <Box className="flex flex-row items-center gap-2">
          <Icon name="calendar" size={14} className="shrink-0 text-gray-400" />
          <Text className="text-text-secondary text-left text-xs leading-relaxed">
            {formattedDate}
          </Text>
        </Box>
      </Box>
    </>
  );

  const footer = (
    <AgreementCardActions
      doc={doc}
      contextualStatus={contextualStatus}
      onDelete={onDelete}
      showDelete={showDelete}
      deleteVoidsEnvelope={deleteVoidsEnvelope}
      isListingAgent={isListingAgent}
      externalActionHandlers={externalActionHandlers}
      layout="list"
    />
  );

  return <AgendaListItemShell accentBarClassName={accentBar} header={header} footer={footer} />;
}
