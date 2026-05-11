import { useMemo } from "react";

import { Icon } from "@ui/icons";

import { type DocumentData, useDocumentsData } from "packages/features/documents";
import { Button, CancelButton } from "packages/ui";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, Title } from "@/components/ui";
import { useSingleSelectionModal } from "@/features/agent/hooks/ui/useSingleSelectionModal";

type SelectDocumentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (document: DocumentData) => void;
};

export default function SelectDocumentModal({
  isOpen,
  onClose,
  onSelect,
}: SelectDocumentModalProps) {
  const { documents: rawDocuments, isLoading: documentsLoading } = useDocumentsData();
  const documentsList = useMemo(
    () => filterDocumentLibraryExcludingAgreements(rawDocuments),
    [rawDocuments]
  );
  const {
    selectedId: selectedDocumentId,
    setSelectedId: setSelectedDocumentId,
    selectedItem: selectedDocument,
    handleConfirm,
    isLoading: documentsLoadingFromHook,
  } = useSingleSelectionModal<DocumentData>(documentsList, (d) => d.id, {
    isLoading: documentsLoading,
  });

  const onConfirm = () => handleConfirm(onSelect, { closeOnConfirm: false });
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <Box className="flex items-center gap-2">
          <Icon name="file-text" className="text-text-primary h-5 w-5 flex-shrink-0" />
          <Title as="h3" size="lg" className="text-text-primary truncate font-medium sm:text-lg">
            Select Document to Share
          </Title>
        </Box>
      }
      size="md"
    >
      <Box className="space-y-4">
        {documentsLoadingFromHook ? (
          <Box className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading documents..." />
          </Box>
        ) : documentsList.length === 0 ? (
          <Box className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-text-secondary">
              No documents found. Upload documents to share them in messages.
            </BodyText>
          </Box>
        ) : (
          <Box className="max-h-96 space-y-2 overflow-y-auto">
            {documentsList.map((document, index) => (
              <Button
                key={document.id || `document-${index}`}
                type="button"
                variant="outline"
                size="sm"
                contentAlign="start"
                onClick={() => setSelectedDocumentId(document.id)}
                className={`h-auto min-h-0 w-full justify-start rounded-lg border p-3 text-left ${
                  selectedDocumentId === document.id
                    ? "border-border bg-primary-muted"
                    : "border-border hover:border-border hover:bg-primary-muted"
                }`}
              >
                <Box className="flex w-full items-start gap-3">
                  <Box className="bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <Icon name="file-text" className="text-primary h-5 w-5" />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <BodyText as="p" size="sm" className="text-text-primary font-medium">
                      {document.address || document.filename || `Document ${document.id}`}
                    </BodyText>
                    {document.created_at ? (
                      <BodyText as="p" size="xs" className="text-text-secondary mt-1">
                        Uploaded {dateParseISO(document.created_at).toDate().toLocaleDateString()}
                      </BodyText>
                    ) : null}
                    {document.document_type ? (
                      <BodyText as="p" size="xs" className="text-text-secondary mt-1">
                        Type: {document.document_type}
                      </BodyText>
                    ) : null}
                  </Box>
                  {selectedDocumentId === document.id && (
                    <Box className="bg-primary h-2 w-2 flex-shrink-0 self-center rounded-full" />
                  )}
                </Box>
              </Button>
            ))}
          </Box>
        )}

        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1">
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={!selectedDocument}
            className="flex-1"
            iconName="share"
          >
            Share Document
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
