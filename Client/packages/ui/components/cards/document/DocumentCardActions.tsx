import { useState } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import PdfModal from "@ui/modals/PdfModal";
import DeleteModal from "@ui/modals/standalone/DeleteModal";

import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";

import type { DocumentCardExternalActionHandlers, DocumentData } from "./types";

interface DocumentCardActionsProps {
  doc: DocumentData;
  onDelete?: (doc: DocumentData) => void;
  showDelete?: boolean;
  isFromOtherUser?: boolean;
  externalActionHandlers?: DocumentCardExternalActionHandlers;
}
function DocumentCardActionButtons({
  doc,
  onViewDocument,
  onDownloadDocument,
  onShareDocument,
  onSendForSignature,
  onSignNow,
  isAgent: _isAgent,
  showDelete,
  onDeleteClick,
}: {
  doc: DocumentData;
  onViewDocument: (id: string, filename: string) => void;
  onDownloadDocument: (id: string, filename: string) => void;
  onShareDocument: (id: string, filename: string) => void;
  onSendForSignature?: (document: DocumentData) => void;
  onSignNow?: (document: DocumentData) => void;
  isAgent: boolean;
  showDelete: boolean;
  onDeleteClick: () => void;
}) {
  const isAgreement = doc.library_kind === "agreement";

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
      {isAgreement && onSignNow ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSignNow(doc)}
          icon={<Icon name="file-signature" size={16} />}
          fullWidth
          className="justify-center"
        >
          Sign now
        </Button>
      ) : null}
      {!isAgreement && onSendForSignature ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSendForSignature(doc)}
          icon={<Icon name="file-signature" size={16} />}
          fullWidth
          className="justify-center"
        >
          Send for Signature
        </Button>
      ) : null}
      <Box className="flex w-full flex-row items-center gap-2">
        <IconButton
          variant="outline"
          size="sm"
          onClick={() => onDownloadDocument(doc.id, doc.filename)}
          icon={<Icon name="download" size={16} />}
          className="border-border text-text-secondary disabled:border-border disabled:text-text-disabled flex-1 bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-100 active:bg-neutral-200 disabled:hover:bg-transparent"
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
            className="border-border text-destructive disabled:border-border disabled:text-text-disabled flex-1 border bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-100 active:bg-neutral-200 disabled:hover:bg-transparent"
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
  isFromOtherUser = false,
  externalActionHandlers,
}: DocumentCardActionsProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const internal = useDocumentActions();
  const handleViewDocument = externalActionHandlers
    ? externalActionHandlers.handleViewDocument
    : internal.handleViewDocument;
  const handleDownloadDocument = externalActionHandlers
    ? externalActionHandlers.handleDownloadDocument
    : internal.handleDownloadDocument;
  const handleShareDocument = externalActionHandlers
    ? externalActionHandlers.handleShareDocument
    : internal.handleShareDocument;
  const handleSendForSignature = externalActionHandlers?.handleSendForSignature;
  const handleSignNow = externalActionHandlers?.handleSignNow;
  const isAgent = externalActionHandlers?.isAgent ?? false;
  const showInlinePdfModal = !externalActionHandlers && internal.currentPdf;
  const handleDeleteConfirm = () => {
    onDelete?.(doc);
    setIsDeleteModalOpen(false);
  };

  // Determine modal text based on whether document is from another user and if it's an agreement
  const isAgreement = doc.library_kind === "agreement";
  const deleteTitle = isFromOtherUser || isAgreement ? "Remove Document" : "Delete Document";
  const deleteMessage = isAgreement
    ? "Are you sure you want to remove this agreement from your library? This will not delete the agreement from DocuSign."
    : isFromOtherUser
      ? "Are you sure you want to remove this document from your library? This will not delete the original document."
      : "Are you sure you want to delete this document? This action cannot be undone.";

  return (
    <>
      <DocumentCardActionButtons
        doc={doc}
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
        onShareDocument={handleShareDocument}
        onSendForSignature={handleSendForSignature}
        onSignNow={handleSignNow}
        isAgent={isAgent}
        showDelete={!!(showDelete && onDelete)}
        onDeleteClick={() => setIsDeleteModalOpen(true)}
      />
      {showInlinePdfModal ? (
        <Portal>
          <PdfModal
            currentPdf={internal.currentPdf}
            currentReportAddress={internal.currentDocumentName}
            reportId={doc.id}
            onClose={internal.closePdfModal}
          />
        </Portal>
      ) : null}
      {showDelete && onDelete && (
        <Portal>
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title={deleteTitle}
            message={deleteMessage}
          />
        </Portal>
      )}
    </>
  );
}
