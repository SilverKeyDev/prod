import type { IconName } from "packages/ui/types/icons";

/**
 * Maps document type to appropriate icon name.
 */
export function getDocumentIconName(documentType: string | null): IconName {
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
