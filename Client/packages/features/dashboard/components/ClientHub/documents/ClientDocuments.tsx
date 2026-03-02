import { useEffect } from "react";

import { useDocumentActions, useDocumentsStoreIntegration } from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import { BodyText, KeyTurnLoader, Title } from "packages/ui/components/index.web";
import { dateParseISO } from "packages/utils/date";

import { PdfModal } from "@/components/modals";

type ClientDocumentsProps = {
  userId: string;
};

export default function ClientDocuments({ userId: _userId }: ClientDocumentsProps) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

  // Use documents store integration
  // Note: This currently fetches for the authenticated user. Backend API needs to support userId parameter
  const {
    documents,
    documentsLoading: loading,
    documentsError: error,
    refreshDocuments: _refreshDocuments,
  } = useDocumentsStoreIntegration();

  // overlay toast component
  useEffect(() => {
    if (error) enqueueToast({ type: "error", message: error });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <div className="space-y-responsive-lg mb-responsive-lg mt-4 lg:mt-0">
        {loading ? (
          <div className="py-responsive-lg flex justify-center">
            <KeyTurnLoader message="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-responsive-lg text-center">
            <BodyText as="p" size="sm" className="text-gray-600">
              No documents found.
            </BodyText>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                onClick={() => {
                  // Open document in PDF modal
                  // This would need to be implemented based on your document viewing logic
                  log.debug(LOG_CATEGORIES.DASHBOARD, "Open document", {
                    documentId: doc.id,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    log.debug(LOG_CATEGORIES.DASHBOARD, "Open document", {
                      documentId: doc.id,
                    });
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Title as="h3" size="sm" className="font-medium text-gray-900">
                      {doc.name}
                    </Title>
                    <BodyText as="p" size="sm" className="text-gray-500">
                      {doc.category} •{" "}
                      {doc.uploaded_at
                        ? dateParseISO(doc.uploaded_at).toDate().toLocaleDateString()
                        : "Unknown date"}
                    </BodyText>
                  </div>
                  <div className="text-sm text-gray-500">
                    {doc.status === "approved" ? "✓ Approved" : "Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
