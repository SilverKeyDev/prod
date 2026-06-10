import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Subtitle from "packages/ui/components/structure/text/Subtitle";

import { getDocumentIconName } from "./documentCardHeaderIcon";
interface DocumentCardHeaderProps {
  /**
   * Document title to display
   */
  title: string;
  /**
   * Document type (report, contract, inspection, financial)
   */
  documentType: string | null;
  /**
   * Formatted upload date string
   */
  uploadedDate: string;
  status?: string;
  isAgreement?: boolean;
  /**
   * Name of the sender (when document was sent from elsewhere)
   */
  sentByName?: string | null;
  /**
   * Email of the sender (when document was sent from elsewhere)
   */
  sentByEmail?: string | null;
  /**
   * Whether the document was uploaded by someone other than the current user
   */
  isFromOtherUser?: boolean;
}
/**
 * Document card header component displaying icon, title, and upload date.
 * Icon changes based on document type.
 */
export default function DocumentCardHeader({
  title,
  documentType,
  uploadedDate,
  status,
  isAgreement = false,
  sentByName,
  sentByEmail,
  isFromOtherUser = false,
}: DocumentCardHeaderProps) {
  const { t } = useLocalization();
  const documentIconName = getDocumentIconName(documentType);
  const normalizedStatus = (status ?? "").toLowerCase();
  const shouldShowStatus = isAgreement && normalizedStatus.length > 0;
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

  // Determine sender display name and whether to show "Sent by" text
  const senderDisplayName = sentByName || sentByEmail || "someone";
  const shouldShowSentBy = isFromOtherUser;

  return (
    <>
      {/* Header with icon and title */}
      <Box className="mb-2 flex flex-row items-start gap-3">
        <Box className="text-foreground flex-shrink-0">
          <Icon name={documentIconName} size={24} />
        </Box>
        <Box className="h-[2.75rem] min-w-0 flex-1 overflow-hidden">
          <Subtitle size="sm" className="line-clamp-2">
            {title}
          </Subtitle>
        </Box>
      </Box>

      {/* Document type temporarily hidden from display */}
      {/*
      <Box className="mb-2 min-h-5">
        {displayType ? (
          <BodyText size="xs" className="font-medium text-gray-600">
            {displayType}
          </BodyText>
        ) : (
          <BodyText size="xs" className="font-medium text-transparent" aria-hidden="true">
            Placeholder
          </BodyText>
        )}
      </Box>
      */}

      {/* Status row keeps reserved height even when status is missing */}
      <Box className="mb-2 min-h-7">
        {shouldShowStatus && statusLabel ? (
          <BodyText
            size="xs"
            className={`inline-flex rounded-full px-2 py-1 font-medium ${statusClassName}`}
          >
            {statusLabel}
          </BodyText>
        ) : (
          <BodyText
            size="xs"
            className="inline-flex rounded-full px-2 py-1 font-medium text-transparent"
            aria-hidden="true"
          >
            Placeholder
          </BodyText>
        )}
      </Box>

      {/* Upload/Send date */}
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="calendar" size={14} className="flex-shrink-0 text-gray-400" />
        <BodyText size="xs" muted>
          {shouldShowSentBy
            ? t("documents.sent_by", {
                name: senderDisplayName,
                date: uploadedDate,
              })
            : t("documents.uploaded", { date: uploadedDate })}
        </BodyText>
      </Box>
    </>
  );
}
