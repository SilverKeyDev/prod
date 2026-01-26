import {
  FileText,
  FileSignature,
  ClipboardCheck,
  Receipt,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BodyText, Subtitle } from "../../ui";

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
function getDocumentIcon(
  documentType: string | null
): LucideIcon {
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
  const Icon = getDocumentIcon(documentType);
  const displayType = formatDocumentType(documentType);

  return (
    <>
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0 text-brown">
          <Icon size={24} />
        </div>
        <div className="flex-1 overflow-hidden min-w-0 h-[2.75rem]">
          <Subtitle size="sm" className="line-clamp-2">
            {title}
          </Subtitle>
        </div>
      </div>

      {/* Document type */}
      <div className="mb-2">
        <BodyText size="xs" className="text-gray-600 font-medium">
          {displayType}
        </BodyText>
      </div>

      {/* Upload date */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
        <BodyText size="xs" muted>
          Uploaded {uploadedDate}
        </BodyText>
      </div>
    </>
  );
}
