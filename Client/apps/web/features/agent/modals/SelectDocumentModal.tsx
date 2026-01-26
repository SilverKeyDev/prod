import { FileText } from "lucide-react";
import { useState } from "react";

import BaseModal from "../../../components/modals/BaseModal";
import Button from "../../../components/ui/button/Button";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
import DocumentCard, { type DocumentData } from "../../../components/cards/documents/DocumentCard";
import { useDocumentsData } from "../../../../../packages/hooks/data/documents/useDocumentsData";

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
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

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
      title="Select Document to Share"
      size="md"
    >
      <div className="space-y-4">
        {documentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <KeyTurnLoader message="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              No documents found. Upload documents to share them in messages.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {documents.map((document, index) => (
              <button
                key={document.id || `document-${index}`}
                onClick={() => setSelectedDocumentId(document.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedDocumentId === document.id
                    ? "border-brown bg-beige/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                    <FileText className="h-5 w-5 text-brown" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {document.address || document.filename || `Document ${document.id}`}
                    </p>
                    {document.created_at && (
                      <p className="mt-1 text-xs text-gray-500">
                        Uploaded {new Date(document.created_at).toLocaleDateString()}
                      </p>
                    )}
                    {document.document_type && (
                      <p className="mt-1 text-xs text-gray-500">
                        Type: {document.document_type}
                      </p>
                    )}
                  </div>
                  {selectedDocumentId === document.id && (
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-brown self-center" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedDocument}
            className="flex-1"
          >
            Share Document
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
