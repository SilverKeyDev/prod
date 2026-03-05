import { useState } from "react";

import { Icon } from "@ui/icons";

import { useDocumentsStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";
import { BodyText, Title } from "packages/ui/components/index.web";
import { dateParseISO } from "packages/utils/date";

import BaseModal from "@/components/modals/BaseModal";
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
  const documents = useDocumentsStore((s) => s.documents);
  const documentsLoading = useDocumentsStore((s) => s.documentsLoading);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const mappedDocuments: DocumentData[] = documents.map((d) => ({
    id: d.id,
    filename: d.name,
    file_path: d.file_path,
    status: d.status,
    created_at: d.uploaded_at ? d.uploaded_at.toISOString() : null,
    updated_at: null,
    user_id: d.uploaded_by,
    document_type: d.document_type ?? null,
    address: d.address ?? null,
  }));
  const handleConfirm = () => {
    if (selectedDocumentId) {
      const document = mappedDocuments.find((d) => d.id === selectedDocumentId);
      if (document) {
        onSelect(document);
        setSelectedDocumentId(null);
      }
    }
  };
  const selectedDocument = selectedDocumentId
    ? mappedDocuments.find((d) => d.id === selectedDocumentId)
    : null;
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div className="flex items-center gap-2">
          <Icon name="file-text" className="h-5 w-5 flex-shrink-0 text-gray-900" />
          <Title as="h3" size="lg" className="truncate font-medium text-gray-900 sm:text-lg">
            Select Document to Share
          </Title>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {documentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading documents..." />
          </div>
        ) : mappedDocuments.length === 0 ? (
          <div className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-gray-500">
              No documents found. Upload documents to share them in messages.
            </BodyText>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {mappedDocuments.map((document, index) => (
              <Button
                key={document.id || `document-${index}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocumentId(document.id)}
                className={`h-auto min-h-0 w-full justify-start rounded-lg border p-3 text-left ${
                  selectedDocumentId === document.id
                    ? "border-olive bg-olive/10"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex w-full items-start gap-3">
                  <div className="bg-beige/20 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                    <Icon name="file-text" className="text-olive h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <BodyText as="p" size="sm" className="font-medium text-gray-900">
                      {document.address || document.filename || `Document ${document.id}`}
                    </BodyText>
                    {document.created_at ? (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        Uploaded {dateParseISO(document.created_at).toDate().toLocaleDateString()}
                      </BodyText>
                    ) : null}
                    {document.document_type ? (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        Type: {document.document_type}
                      </BodyText>
                    ) : null}
                  </div>
                  {selectedDocumentId === document.id && (
                    <div className="bg-olive h-2 w-2 flex-shrink-0 self-center rounded-full" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1">
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedDocument}
            className="flex-1"
            iconName="share"
          >
            Share Document
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
