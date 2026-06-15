/**
 * FormsLibraryTab - Full forms library view for Library / Documents.
 * Toolbar (search, sort, view mode) is provided by the parent Saved layout.
 */

import type { ChecklistForm } from "packages/features/documents/types/forms";
import { Box } from "packages/ui/components/structure/primitives";

import FormsBrowser from "./FormsBrowser";

type FormsLibraryTabProps = {
  onSendForSignature?: (form: ChecklistForm) => void;
  /** Horizontal padding aligned with Saved documents (e.g. `px-4 sm:px-6…`). */
  containerClass: string;
  formsGridClassName?: string;
  searchTerm?: string;
  librarySortKey?: string;
  libraryViewMode?: "grid" | "list";
};

export default function FormsLibraryTab({
  onSendForSignature,
  containerClass,
  formsGridClassName,
  searchTerm = "",
  librarySortKey = "date_desc",
  libraryViewMode = "grid",
}: FormsLibraryTabProps) {
  const handleSendForSignature = (form: ChecklistForm) => {
    if (onSendForSignature) {
      onSendForSignature(form);
    }
  };

  return (
    <Box className="w-full">
      <Box className={containerClass}>
        <FormsBrowser
          formsGridClassName={formsGridClassName}
          onSendForSignature={onSendForSignature ? handleSendForSignature : undefined}
          showActions
          searchTerm={searchTerm}
          librarySortKey={librarySortKey}
          libraryViewMode={libraryViewMode}
        />
      </Box>
    </Box>
  );
}
