import type { LucideIcon } from "lucide-react";
import { Calendar, ClipboardCheck, FileSignature, FileText, Receipt } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { BodyText, Subtitle } from "packages/ui/components/index.web";

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
 * Maps document type to appropriate Lucide icon
 */
function getDocumentIcon(documentType: string | null): LucideIcon {
  switch (documentType) {
    case "contract":
      return FileSignature;
    case "inspection":
      return ClipboardCheck;
    case "financial":
      return Receipt;
    case "report":
    default:
      return FileText;
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
  const Icon = getDocumentIcon(documentType);
  const displayType = formatDocumentType(documentType);

  return (
    <>
      {/* Header with icon and title */}
      <div className="mb-2 flex items-start gap-3">
        <div className="text-brown flex-shrink-0">
          <Icon size={24} />
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
        <Calendar size={14} className="flex-shrink-0 text-gray-400" />
        <BodyText size="xs" muted>
          {t("documents.uploaded", { date: uploadedDate })}
        </BodyText>
      </div>
    </>
  );
}
