import { useState } from "react";
import { createPortal } from "react-dom";

import { Button, IconButton } from "@ui/index.web";
import { Download, Eye, Share, Trash2 } from "lucide-react";

import { useDocumentActions } from "packages/hooks/data/documents/useDocumentActions";

import { DeleteModal, PdfModal } from "@/components/modals";

import type { DocumentData } from "./types";

interface DocumentCardActionsProps {
  doc: DocumentData;
  onDelete?: (doc: DocumentData) => void;
  showDelete?: boolean;
}

function DocumentCardActionButtons({
  doc,
  onViewDocument,
  onDownloadDocument,
  onShareDocument,
  showDelete,
  onDeleteClick,
}: {
  doc: DocumentData;
  onViewDocument: (id: string, filename: string) => void;
  onDownloadDocument: (id: string, filename: string) => void;
  onShareDocument: (id: string, filename: string) => void;
  showDelete: boolean;
  onDeleteClick: () => void;
}) {
  return (
    <div className="space-y-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onViewDocument(doc.id, doc.filename)}
        icon={<Eye size={16} />}
        fullWidth
        className="justify-center"
      />
      <div className="flex items-center gap-2 w-full">
        <IconButton
          variant="outline"
          size="sm"
          onClick={() => onDownloadDocument(doc.id, doc.filename)}
          icon={<Download size={16} />}
          className="flex-1 bg-transparent border-gray-400 text-gray-600 hover:bg-gray-50 hover:border-gray-500 focus:ring-gray-400/20 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
        />
        <IconButton
          variant="tertiary"
          size="sm"
          onClick={() => onShareDocument(doc.id, doc.filename)}
          icon={<Share size={16} />}
          className="flex-1"
        />
        {showDelete && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onDeleteClick}
            icon={<Trash2 size={16} />}
            className="flex-1 bg-transparent border border-rose text-rose hover:bg-rose/10 focus:ring-rose/20 disabled:border-rose/30 disabled:text-rose/30 disabled:hover:bg-transparent"
          />
        )}
      </div>
    </div>
  );
}

export default function DocumentCardActions({
  doc,
  onDelete,
  showDelete = false,
}: DocumentCardActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const {
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    currentPdf,
    currentDocumentName,
    closePdfModal,
  } = useDocumentActions();

  const handleDeleteConfirm = () => {
    onDelete?.(doc);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <DocumentCardActionButtons
        doc={doc}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onShareDocument={handleShareDocument}
        showDelete={!!(showDelete && onDelete)}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />
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
      {showDelete && onDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Report"
          message="Are you sure you want to delete this report? This action cannot be undone."
        />
      )}
    </>
  );
}
