import { useState } from "react";

import { FileText } from "lucide-react";

import { useDocumentsData } from "packages/hooks/data/documents/useDocumentsData";
import { dateParseISO } from "packages/utils/core/date";

import type { DocumentData } from "@/components/cards/documents/DocumentCard";
import BaseModal from "@/components/modals/BaseModal";
import Button from "@/components/ui/button/Button";
import CancelButton from "@/components/ui/button/CancelButton";
import { BodyText, Title } from "@/components/ui/index.web";
import KeyTurnLoader from "@/components/ui/loading/KeyTurnLoader.web";

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
  const { documents, isLoading: documentsLoading } = useDocumentsData();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );

  const handleConfirm = () => {
    if (selectedDocumentId) {
      const document = documents.find((d) => d.id === selectedDocumentId);
      if (document) {
        onSelect(document);
        setSelectedDocumentId(null);
      }
    }
  };

  const selectedDocument = selectedDocumentId
    ? documents.find((d) => d.id === selectedDocumentId)
    : null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 flex-shrink-0 text-gray-900" />
          <Title
            as="h3"
            size="lg"
            className="truncate font-medium text-gray-900 sm:text-lg"
          >
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
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <BodyText as="p" size="sm" className="text-gray-500">
              No documents found. Upload documents to share them in messages.
            </BodyText>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {documents.map((document, index) => (
              <Button
                key={document.id || `document-${index}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocumentId(document.id)}
                className={`w-full rounded-lg border p-3 text-left justify-start h-auto min-h-0 ${
                  selectedDocumentId === document.id
                    ? "border-olive bg-olive/10"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                    <FileText className="h-5 w-5 text-olive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <BodyText
                      as="p"
                      size="sm"
                      className="font-medium text-gray-900"
                    >
                      {document.address ||
                        document.filename ||
                        `Document ${document.id}`}
                    </BodyText>
                    {document.created_at && (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        Uploaded{" "}
                        {dateParseISO(document.created_at)
                          .toDate()
                          .toLocaleDateString()}
                      </BodyText>
                    )}
                    {document.document_type && (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        Type: {document.document_type}
                      </BodyText>
                    )}
                  </div>
                  {selectedDocumentId === document.id && (
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-olive self-center" />
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
