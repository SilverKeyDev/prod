import { useState } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import PdfModal from "@ui/modals/PdfModal";
import DeleteModal from "@ui/modals/standalone/DeleteModal";

import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";

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
    <Box className="flex flex-col gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => onViewDocument(doc.id, doc.filename)}
        icon={<Icon name="eye" size={16} />}
        fullWidth
        className="justify-center"
      />
      <Box className="flex w-full flex-row items-center gap-2">
        <IconButton
          variant="outline"
          size="sm"
          onClick={() => onDownloadDocument(doc.id, doc.filename)}
          icon={<Icon name="download" size={16} />}
          className="flex-1 border-gray-400 bg-transparent text-gray-600 hover:border-gray-500 hover:bg-gray-50 focus:ring-neutral-400 active:border-gray-500 active:bg-gray-100 active:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
        />
        <IconButton
          variant="tertiary"
          size="sm"
          onClick={() => onShareDocument(doc.id, doc.filename)}
          icon={<Icon name="share" size={16} />}
          className="flex-1"
        />
        {showDelete && (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onDeleteClick}
            icon={<Icon name="trash-2" size={16} />}
            className="border-rose text-rose focus:ring-rose flex-1 border bg-transparent hover:bg-neutral-100 active:bg-neutral-100 active:bg-neutral-200 disabled:border-neutral-300 disabled:text-neutral-500 disabled:hover:bg-transparent"
          />
        )}
      </Box>
    </Box>
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
      {currentPdf && (
        <Portal>
          <PdfModal
            currentPdf={currentPdf}
            currentReportAddress={currentDocumentName}
            reportId={doc.id}
            onClose={closePdfModal}
          />
        </Portal>
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
