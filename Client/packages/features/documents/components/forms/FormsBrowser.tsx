/**
 * FormsBrowser - Browse and select forms from the forms library.
 * Shows categories (folders) and forms within each category.
 */

import type { ChecklistForm } from "packages/features/documents/types/forms";

import {
  FormsBrowserCategoryForms,
  FormsBrowserCategoryGrid,
  FormsBrowserEmptyLibrary,
  FormsBrowserError,
  FormsBrowserLoading,
  FormsBrowserNoSearchResults,
} from "./formsBrowser/index";
import { useFormsBrowserController } from "./formsBrowser/useFormsBrowserController";

type FormsBrowserProps = {
  /** When provided with `showActions={false}` (e.g. upload modal), tapping a form card selects it. */
  onSelectForm?: (form: ChecklistForm) => void;
  onClose?: () => void;
  showActions?: boolean; // Show download / send-for-signature controls (default: true)
  onSendForSignature?: (form: ChecklistForm) => void;
  /** Grid layout for form cards (e.g. Saved page documents grid). */
  formsGridClassName?: string;
  /** Library toolbar search (Saved forms tab); filters categories and forms. */
  searchTerm?: string;
  /** Persisted sort from Library toolbar (same IDs as documents: date_desc, date_asc, name_asc). */
  librarySortKey?: string;
  /** Grid vs list from Library view toggle. */
  libraryViewMode?: "grid" | "list";
};

export default function FormsBrowser({
  onSelectForm,
  onClose,
  showActions = true,
  onSendForSignature,
  formsGridClassName = "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  searchTerm = "",
  librarySortKey = "date_desc",
  libraryViewMode = "grid",
}: FormsBrowserProps) {
  const {
    t,
    categories,
    isLoading,
    error,
    processedCategories,
    selectedCategory,
    setSelectedCategory,
    libraryActionHandlers,
    closePdfModal,
    currentPdf,
    currentDocumentName,
    currentDocumentId,
    logFormSelected,
  } = useFormsBrowserController({
    searchTerm,
    librarySortKey,
    onSendForSignature,
  });

  if (isLoading) {
    return <FormsBrowserLoading />;
  }

  if (error) {
    return <FormsBrowserError />;
  }

  if (processedCategories.length === 0 && categories.length > 0 && searchTerm.trim()) {
    return <FormsBrowserNoSearchResults />;
  }

  if (categories.length === 0) {
    return <FormsBrowserEmptyLibrary />;
  }

  if (!selectedCategory) {
    return (
      <FormsBrowserCategoryGrid
        processedCategories={processedCategories}
        libraryViewMode={libraryViewMode}
        onSelectCategory={setSelectedCategory}
        onClose={onClose}
        closeLabel={t("common.close", { defaultValue: "Close" })}
        formLabelSingular={t("forms.form", { defaultValue: "form" })}
        formLabelPlural={t("forms.forms", { defaultValue: "forms" })}
      />
    );
  }

  const category = processedCategories.find((c) => c.name === selectedCategory);
  if (!category) {
    return null;
  }

  return (
    <FormsBrowserCategoryForms
      category={category}
      libraryViewMode={libraryViewMode}
      formsGridClassName={formsGridClassName}
      showActions={showActions}
      onSelectForm={onSelectForm}
      onBack={() => setSelectedCategory(null)}
      backLabel={t("common.back", { defaultValue: "Back" })}
      formAvailableSingular={t("forms.form_available", { defaultValue: "form available" })}
      formAvailablePlural={t("forms.forms_available", { defaultValue: "forms available" })}
      libraryActionHandlers={libraryActionHandlers}
      logFormSelected={logFormSelected}
      showPdfPortal={showActions}
      currentPdf={currentPdf}
      currentDocumentName={currentDocumentName}
      currentDocumentId={currentDocumentId}
      onClosePdf={closePdfModal}
    />
  );
}
