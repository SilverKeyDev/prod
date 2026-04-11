import { useState } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import PdfModal from "@ui/modals/PdfModal";
import DeleteModal from "@ui/modals/standalone/DeleteModal";

import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";

import type {
  AgreementCardExternalActionHandlers,
  AgreementData,
  ContextualAgreementStatus,
} from "./types";

interface AgreementCardActionsProps {
  doc: AgreementData;
  contextualStatus: ContextualAgreementStatus;
  onDelete?: (doc: AgreementData) => void;
  showDelete?: boolean;
  externalActionHandlers?: AgreementCardExternalActionHandlers;
}

export default function AgreementCardActions({
  doc,
  contextualStatus,
  onDelete,
  showDelete = false,
  externalActionHandlers,
}: AgreementCardActionsProps) {
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
  const handleSignNow = externalActionHandlers?.handleSignNow;

  const showInlinePdfModal = !externalActionHandlers && internal.currentPdf;

  const handleDeleteConfirm = () => {
    onDelete?.(doc);
    setIsDeleteModalOpen(false);
  };

  const showSignNow = contextualStatus === "sign_now" && handleSignNow;
  const showViewSigned = contextualStatus === "completed";

  return (
    <>
      <Box className="flex flex-col gap-2">
        {/* Primary CTA adapts to contextual status */}
        {showSignNow ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSignNow(doc)}
            icon={<Icon name="pen-tool" size={16} />}
            fullWidth
            className="justify-center bg-amber-600 hover:bg-amber-700"
          >
            Sign Now
          </Button>
        ) : showViewSigned ? (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleViewDocument(doc.id, doc.filename)}
            icon={<Icon name="check-circle" size={16} />}
            fullWidth
            className="justify-center"
          >
            View Signed Document
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleViewDocument(doc.id, doc.filename)}
            icon={<Icon name="eye" size={16} />}
            fullWidth
            className="justify-center"
          >
            View Document
          </Button>
        )}

        {/* Secondary actions */}
        <Box className="flex w-full flex-row items-center gap-2">
          <IconButton
            variant="outline"
            size="sm"
            onClick={() => handleDownloadDocument(doc.id, doc.filename)}
            icon={<Icon name="download" size={16} />}
            className="border-border text-text-secondary flex-1 bg-transparent hover:bg-neutral-100 active:bg-neutral-200"
          />
          <IconButton
            variant="tertiary"
            size="sm"
            onClick={() => handleShareDocument(doc.id, doc.filename)}
            icon={<Icon name="share" size={16} />}
            className="flex-1"
          />
          {showDelete && onDelete && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Icon name="trash-2" size={16} />}
              className="border-border text-destructive flex-1 border bg-transparent hover:bg-neutral-100 active:bg-neutral-200"
            />
          )}
        </Box>
      </Box>

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
            title="Remove Agreement"
            message="Are you sure you want to remove this agreement from your library? This will not delete the agreement from DocuSign."
          />
        </Portal>
      )}
    </>
  );
}
