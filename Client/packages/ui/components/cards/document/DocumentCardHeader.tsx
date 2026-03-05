import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { BodyText, Subtitle } from "packages/ui/components/index.web";
import type { IconName } from "packages/ui/types/icons";
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
}
/**
 * Maps document type to appropriate icon name.
 */
function getDocumentIconName(documentType: string | null): IconName {
  switch (documentType) {
    case "contract":
      return "file-signature";
    case "inspection":
      return "clipboard-check";
    case "financial":
      return "receipt";
    case "report":
    default:
      return "file-text";
  }
}
/**
 * Formats document type for display, returning 'other' if type is null or unknown
 */
function formatDocumentType(documentType: string | null): string {
  if (!documentType) {
    return "other";
  }
  const normalizedType = documentType.toLowerCase();
  const validTypes = ["report", "contract", "inspection", "financial"];
  if (validTypes.includes(normalizedType)) {
    // Capitalize first letter
    return normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
  }
  return "other";
}
/**
 * Document card header component displaying icon, title, and upload date.
 * Icon changes based on document type.
 */
export default function DocumentCardHeader({
  title,
  documentType,
  uploadedDate,
}: DocumentCardHeaderProps) {
  const { t } = useLocalization();
  const documentIconName = getDocumentIconName(documentType);
  const displayType = formatDocumentType(documentType);
  return (
    <>
      {/* Header with icon and title */}
      <div className="mb-2 flex items-start gap-3">
        <div className="text-brown flex-shrink-0">
          <Icon name={documentIconName} size={24} />
        </div>
        <div className="h-[2.75rem] min-w-0 flex-1 overflow-hidden">
          <Subtitle size="sm" className="line-clamp-2">
            {title}
          </Subtitle>
        </div>
      </div>

      {/* Document type */}
      <div className="mb-2">
        <BodyText size="xs" className="font-medium text-gray-600">
          {displayType}
        </BodyText>
      </div>

      {/* Upload date */}
      <div className="mb-4 flex items-center gap-2">
        <Icon name="calendar" size={14} className="flex-shrink-0 text-gray-400" />
        <BodyText size="xs" muted>
          {t("documents.uploaded", { date: uploadedDate })}
        </BodyText>
      </div>
    </>
  );
}
