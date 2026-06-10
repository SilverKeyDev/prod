import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  formatDate,
  formatFilenameToAddress,
} from "packages/features/search/types/search/formatters/address";
import { useAuthStore } from "packages/store";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { AgendaListItemShell } from "packages/ui/components/surfaces/patterns/AgendaListItemShell";
import { extractReportTitleFromPath } from "packages/utils/transaction/documents";

import { BodyText } from "@/components/ui";

import DocumentCardActions from "./DocumentCardActions";
import { getDocumentIconName } from "./documentCardHeaderIcon";
import type { DocumentCardProps } from "./types";

/**
 * Library list / agenda-style row for non-agreement documents.
 */
export default function DocumentListRow({
  doc,
  onDelete,
  showDelete = false,
  externalActionHandlers,
}: DocumentCardProps) {
  const { t } = useLocalization();
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id;

  const baseName = doc.file_path
    ? extractReportTitleFromPath(doc.file_path)
    : doc.address || formatFilenameToAddress(doc.filename);

  const formattedDate = doc.created_at ? formatDate(doc.created_at) : "Unknown";
  const isFromOtherUser = Boolean(currentUserId && doc.user_id && currentUserId !== doc.user_id);
  const shouldShowDelete = isFromOtherUser || showDelete || !!onDelete;

  const normalizedStatus = (doc.status ?? "").toLowerCase();
  const shouldShowStatus = doc.library_kind === "agreement" && normalizedStatus.length > 0;
  const statusLabel =
    normalizedStatus.length > 0
      ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
      : null;
  const statusClassName =
    normalizedStatus === "completed"
      ? "bg-green-100 text-green-700"
      : normalizedStatus === "signed"
        ? "bg-purple-100 text-purple-700"
        : normalizedStatus === "sent" || normalizedStatus === "delivered"
          ? "bg-blue-100 text-blue-700"
          : normalizedStatus === "voided" || normalizedStatus === "declined"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700";

  const senderDisplayName = doc.sent_by_name || doc.sent_by_email || "someone";
  const shouldShowSentBy = isFromOtherUser;

  const documentIconName = getDocumentIconName(doc.document_type);

  const header = (
    <>
      <Box className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
        <Icon name={documentIconName} size={18} className="text-gray-600" />
      </Box>
      <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Text className="text-text-primary text-left text-sm font-semibold leading-snug">
          {baseName}
        </Text>
        {shouldShowStatus && statusLabel ? (
          <BodyText
            size="xs"
            className={`inline-flex self-start rounded-full px-2 py-0.5 font-medium ${statusClassName}`}
          >
            {statusLabel}
          </BodyText>
        ) : null}
        <Box className="flex flex-row items-center gap-2">
          <Icon name="calendar" size={14} className="shrink-0 text-gray-400" />
          <Text className="text-text-secondary text-left text-xs leading-relaxed">
            {shouldShowSentBy
              ? t("documents.sent_by", {
                  name: senderDisplayName,
                  date: formattedDate,
                })
              : t("documents.uploaded", { date: formattedDate })}
          </Text>
        </Box>
      </Box>
    </>
  );

  const footer = (
    <DocumentCardActions
      doc={doc}
      onDelete={onDelete}
      showDelete={shouldShowDelete}
      isFromOtherUser={isFromOtherUser}
      externalActionHandlers={externalActionHandlers}
      layout="list"
    />
  );

  return <AgendaListItemShell accentBarClassName="bg-gray-300" header={header} footer={footer} />;
}
