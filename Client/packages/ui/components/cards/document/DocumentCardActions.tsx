import { useState } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import DeleteModal from "@ui/modals/standalone/DeleteModal";

import { useLocalization } from "packages/contexts";
import PdfModal from "packages/features/documents/components/pdf/PdfModalBridge";
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
  /** Library list rows: actions column with equal-width rows (flex). */
  layout?: "card" | "list";
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
  layout = "card",
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
  layout?: "card" | "list";
}) {
  const { t } = useLocalization();
  const isAgreement = doc.library_kind === "agreement";
  const isList = layout === "list";
  const primaryClass = isList ? "min-w-0 flex-1 justify-center px-2" : "justify-center";
  const iconRowClass = isList
    ? "flex w-full min-w-0 flex-row items-stretch gap-2"
    : "flex w-full flex-row items-center gap-2";
  const iconOutlineList =
    "min-w-0 flex-1 border-border text-text-secondary bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-200 disabled:hover:bg-transparent";
  const iconGhostList =
    "min-w-0 flex-1 border border-border text-destructive bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-200 disabled:hover:bg-transparent";

  return (
    <Box className={isList ? "flex w-full min-w-0 flex-col gap-2" : "flex flex-col gap-2"}>
      <Box
        className={
          isList ? "flex w-full min-w-0 flex-row flex-wrap items-stretch gap-2" : "contents"
        }
      >
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewDocument(doc.id, doc.filename)}
          icon={<Icon name="eye" size={16} />}
          fullWidth={!isList}
          className={primaryClass}
        >
          {t("documents.view_document")}
        </Button>
        {isAgreement && onSignNow ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSignNow(doc)}
            icon={<Icon name="file-signature" size={16} />}
            fullWidth={!isList}
            className={primaryClass}
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
            fullWidth={!isList}
            className={primaryClass}
          >
            {t("forms.send_for_signature")}
          </Button>
        ) : null}
      </Box>
      <Box className={iconRowClass}>
        <IconButton
          variant="outline"
          size="sm"
          label={t("pdf.download")}
          onClick={() => onDownloadDocument(doc.id, doc.filename)}
          icon={<Icon name="download" size={16} />}
          className={
            isList
              ? iconOutlineList
              : "border-border text-text-secondary disabled:border-border disabled:text-text-disabled flex-1 bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-200 disabled:hover:bg-transparent"
          }
        />
        <IconButton
          variant="tertiary"
          size="sm"
          label={t("saved.share_document")}
          onClick={() => onShareDocument(doc.id, doc.filename)}
          icon={<Icon name="share" size={16} />}
          className={isList ? "min-w-0 flex-1" : "flex-1"}
        />
        {showDelete && (
          <IconButton
            variant="ghost"
            size="sm"
            label={t("saved.delete_document")}
            onClick={onDeleteClick}
            icon={<Icon name="trash-2" size={16} />}
            className={
              isList
                ? iconGhostList
                : "border-border text-destructive disabled:border-border disabled:text-text-disabled flex-1 border bg-transparent hover:bg-neutral-100 focus:ring-neutral-400 active:bg-neutral-200 disabled:hover:bg-transparent"
            }
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
  layout = "card",
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
        layout={layout}
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
