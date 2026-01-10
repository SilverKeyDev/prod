import { useState, useEffect } from "react";
import { useDocumentsStoreIntegration } from "../../../../../packages/hooks/store/useDocumentsStoreIntegration";
import { KeyTurnLoader } from "../../../components/ui";
import PdfModal from "../../../components/modals/PdfModal";
import { useDocumentActions } from "../../../../../packages/hooks/data/useDocumentActions";
import { useUIStore } from "../../../../../packages/store";

type ClientDocumentsProps = {
  userId: string;
};

export default function ClientDocuments({ userId }: ClientDocumentsProps) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

  // Use documents store integration
  // Note: This currently fetches for the authenticated user. Backend API needs to support userId parameter
  const {
    documents,
    documentsLoading: loading,
    documentsError: error,
    refreshDocuments,
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
      <div className="mt-4 lg:mt-0 space-y-responsive-lg mb-responsive-lg">
        {loading ? (
          <div className="py-responsive-lg flex justify-center">
            <KeyTurnLoader message="Loading documents..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-responsive-lg text-center">
            <p className="text-responsive-sm text-gray-600">
              No documents found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  // Open document in PDF modal
                  // This would need to be implemented based on your document viewing logic
                  console.log("Open document:", doc.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500">
                      {doc.category} •{" "}
                      {doc.uploaded_at
                        ? new Date(doc.uploaded_at).toLocaleDateString()
                        : "Unknown date"}
                    </p>
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
