import { Download, Eye, Share, Trash2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { IconButton, Button } from "../../ui";
import DeleteModal from "../../modals/DeleteModal";
import PdfModal from "../../modals/PdfModal";
import type { DocumentData } from "./DocumentCard";
import { useDocumentActions } from "../../../../../packages/hooks/data/documents/useDocumentActions";

interface DocumentCardActionsProps {
  /**
   * Document data
   */
  doc: DocumentData;
  /**
   * Optional callback for when document is deleted
   */
  onDelete?: (doc: DocumentData) => void;
  /**
   * Whether to show the delete button
   */
  showDelete?: boolean;
}

/**
 * Document card action buttons component
 * Handles all action buttons (View, Download, Share, Delete) with built-in handlers
 * and modals (PDF viewing, delete confirmation)
 */
export default function DocumentCardActions({
  doc,
  onDelete,
  showDelete = false,
}: DocumentCardActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Get document action handlers and PDF modal state
  const {
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete(doc);
    }
    setIsDeleteModalOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="space-y-2">
        {/* View button - full width */}
        <Button
          variant="olive"
          size="sm"
          onClick={() => handleViewDocument(doc.id, doc.filename)}
          icon={<Eye size={16} />}
          fullWidth
          className="justify-center"
        />

        {/* Other action buttons - second row */}
        <div className="flex items-center gap-2 w-full">
          <IconButton
            variant="outline"
            size="sm"
            onClick={() => handleDownloadDocument(doc.id, doc.filename)}
            icon={<Download size={16} />}
            className="flex-1 bg-transparent border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500 focus:ring-gray-400/20 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
          />
          <IconButton
            variant="warning"
            size="sm"
            onClick={() => handleShareDocument(doc.id, doc.filename)}
            icon={<Share size={16} />}
            className="flex-1"
          />
          {showDelete && onDelete && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              icon={<Trash2 size={16} />}
              className="flex-1 bg-transparent border border-rose text-rose hover:bg-rose/10 focus:ring-rose/20 disabled:border-rose/30 disabled:text-rose/30 disabled:hover:bg-transparent"
            />
          )}
        </div>
      </div>

      {/* PDF Modal - rendered at document root via portal */}
      {currentPdf &&
        createPortal(
          <PdfModal
            currentPdf={currentPdf}
            currentReportAddress={currentDocumentName}
            reportId={doc.id}
            onClose={closePdfModal}
          />,
          document.body,
        )}

      {/* Delete confirmation modal */}
      {showDelete && onDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Report"
          message="Are you sure you want to delete this report? This action cannot be undone."
        />
      )}
    </>
  );
}
