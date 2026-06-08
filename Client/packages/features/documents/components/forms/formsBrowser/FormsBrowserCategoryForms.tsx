import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import type { FormCategory } from "packages/features/documents/hooks/data/useFormsLibrary";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import {
  checklistFormToDocumentData,
  formatFormLibraryCardDate,
} from "packages/features/documents/utils/forms/checklistFormToDocumentData";
import { Button } from "packages/ui";
import BaseCard from "packages/ui/components/cards/BaseCard";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import DocumentCardHeader from "packages/ui/components/cards/document/DocumentCardHeader";
import DocumentListRow from "packages/ui/components/cards/document/DocumentListRow";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import { formatFormsLibraryCategoryLabel } from "packages/utils/documents";

import { BodyText, Subtitle, Title } from "@/components/ui";

type FormsBrowserCategoryFormsProps = {
  category: FormCategory;
  libraryViewMode: "grid" | "list";
  formsGridClassName: string;
  showActions: boolean;
  onSelectForm?: (form: ChecklistForm) => void;
  onBack: () => void;
  backLabel: string;
  formAvailableSingular: string;
  formAvailablePlural: string;
  libraryActionHandlers: DocumentCardExternalActionHandlers;
  logFormSelected: (form: ChecklistForm) => void;
  showPdfPortal: boolean;
  currentPdf: string | null | undefined;
  currentDocumentName: string | null | undefined;
  currentDocumentId: string | null | undefined;
  onClosePdf: () => void;
};

export function FormsBrowserCategoryForms({
  category,
  libraryViewMode,
  formsGridClassName,
  showActions,
  onSelectForm,
  onBack,
  backLabel,
  formAvailableSingular,
  formAvailablePlural,
  libraryActionHandlers,
  logFormSelected,
  showPdfPortal,
  currentPdf,
  currentDocumentName,
  currentDocumentId,
  onClosePdf,
}: FormsBrowserCategoryFormsProps) {
  return (
    <Box className="w-full">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Button variant="ghost" size="sm" onPress={onBack} label="Back" iconName="home">
          ← {backLabel}
        </Button>
      </Box>

      <Box className="mb-4">
        <Title as="h3" size="sm" className="mb-1">
          {formatFormsLibraryCategoryLabel(category.name)}
        </Title>
        <Subtitle size="xs">
          {category.forms.length}{" "}
          {category.forms.length === 1 ? formAvailableSingular : formAvailablePlural}
        </Subtitle>
      </Box>

      <Box
        className={
          libraryViewMode === "list" ? "gap-responsive-md flex w-full flex-col" : formsGridClassName
        }
      >
        {category.forms.map((form) => {
          const cardSelectable = Boolean(onSelectForm) && !showActions;
          const doc = checklistFormToDocumentData(form);

          if (showActions) {
            return (
              <Box key={form.id} className="group relative w-full">
                {libraryViewMode === "list" ? (
                  <DocumentListRow doc={doc} externalActionHandlers={libraryActionHandlers} />
                ) : (
                  <DocumentCard doc={doc} externalActionHandlers={libraryActionHandlers} />
                )}
              </Box>
            );
          }

          return (
            <BaseCard
              key={form.id}
              variant="default"
              padding="md"
              rounded="lg"
              shadow="sm"
              hover={cardSelectable}
              cardType="searchpage"
              scale="md"
              width="full"
              background="white"
              className={cardSelectable ? "cursor-pointer" : ""}
              role={cardSelectable ? "button" : undefined}
              tabIndex={cardSelectable ? 0 : undefined}
              onClick={
                cardSelectable
                  ? () => {
                      logFormSelected(form);
                      onSelectForm?.(form);
                    }
                  : undefined
              }
              onKeyDown={
                cardSelectable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        logFormSelected(form);
                        onSelectForm?.(form);
                      }
                    }
                  : undefined
              }
            >
              <DocumentCardHeader
                title={form.title}
                documentType="report"
                uploadedDate={formatFormLibraryCardDate(form)}
              />
              {form.description ? (
                <BodyText as="p" size="xs" muted className="line-clamp-3">
                  {form.description}
                </BodyText>
              ) : null}
            </BaseCard>
          );
        })}
      </Box>

      {showPdfPortal && currentPdf ? (
        <Portal>
          <PdfModal
            currentPdf={currentPdf}
            currentReportAddress={currentDocumentName}
            reportId={currentDocumentId}
            onClose={onClosePdf}
          />
        </Portal>
      ) : null}
    </Box>
  );
}
