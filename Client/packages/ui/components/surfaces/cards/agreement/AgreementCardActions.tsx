import { useState } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import DeleteModal from "@ui/modals/standalone/DeleteModal";

import { useLocalization } from "packages/contexts";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { showErrorToast } from "packages/hooks/ui";
import { Portal } from "packages/ui/components/structure/portal";
import { Box } from "packages/ui/components/structure/primitives";

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
  /** When true, copy explains DocuSign void + removal for all parties. */
  deleteVoidsEnvelope?: boolean;
  /** Viewer is the listing agent (copy may mention removing from client Saved too). */
  isListingAgent?: boolean;
  deleteModalTitle?: string;
  deleteModalMessage?: string;
  externalActionHandlers?: AgreementCardExternalActionHandlers;
  /** Library list rows: actions column with equal-width rows (flex). */
  layout?: "card" | "list";
}

export default function AgreementCardActions({
  doc,
  contextualStatus,
  onDelete,
  showDelete = false,
  deleteVoidsEnvelope = false,
  isListingAgent = false,
  deleteModalTitle,
  deleteModalMessage,
  externalActionHandlers,
  layout = "card",
}: AgreementCardActionsProps) {
  const { t } = useLocalization();
  const isList = layout === "list";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const internal = useDocumentActions();

  const handleViewDocument = externalActionHandlers?.handleViewDocument;
  const handleDownloadDocument = externalActionHandlers
    ? externalActionHandlers.handleDownloadDocument
    : internal.handleDownloadDocument;
  const handleShareDocument = externalActionHandlers
    ? externalActionHandlers.handleShareDocument
    : internal.handleShareDocument;
  const handleSignNow = externalActionHandlers?.handleSignNow;
  const handleViewSignedAgreement = externalActionHandlers?.handleViewSignedAgreement;

  const openAgreementViewer = () => {
    if (showViewSigned) {
      if (handleViewSignedAgreement) {
        handleViewSignedAgreement(doc);
        return;
      }
      if (handleViewDocument) {
        handleViewDocument(doc.id, doc.filename);
        return;
      }
    } else if (handleViewDocument) {
      handleViewDocument(doc.id, doc.filename);
      return;
    }
    showErrorToast("Unable to open agreement viewer. Refresh and try again.");
  };

  const handleDeleteConfirm = () => {
    onDelete?.(doc);
    setIsDeleteModalOpen(false);
  };

  const showViewSigned = contextualStatus === "completed";
  const showSignCta =
    Boolean(handleSignNow) &&
    !showViewSigned &&
    doc.library_kind === "agreement" &&
    contextualStatus === "sign_now";

  const resolvedDeleteTitle =
    deleteModalTitle ?? (deleteVoidsEnvelope ? "Cancel agreement" : "Remove Agreement");
  const resolvedDeleteMessage =
    deleteModalMessage ??
    (deleteVoidsEnvelope
      ? "This voids the DocuSign envelope for every signer and removes it from everyone's saved documents. You can't undo this."
      : isListingAgent
        ? "This removes the agreement from Saved for you and your client. If the envelope is still in progress, we cancel it in DocuSign when DocuSign allows; completed agreements are removed from Saved only."
        : "Are you sure you want to remove this agreement from your library? This will not delete the agreement from DocuSign.");

  const primaryBtnClass = isList ? "min-w-0 flex-1 justify-center px-2" : "justify-center";
  const iconRowClass = isList
    ? "flex w-full min-w-0 flex-row items-stretch gap-2"
    : "flex w-full flex-row items-center gap-2";
  const iconBtnBaseList =
    "min-w-0 flex-1 border-border text-text-secondary bg-transparent hover:bg-neutral-100 active:bg-neutral-200";
  const iconBtnShareClass = isList ? `min-w-0 flex-1` : "flex-1";
  const iconBtnDeleteClass = isList
    ? "min-w-0 flex-1 border border-border text-destructive bg-transparent hover:bg-neutral-100 active:bg-neutral-200"
    : "border-border text-destructive flex-1 border bg-transparent hover:bg-neutral-100 active:bg-neutral-200";

  return (
    <>
      <Box className={isList ? "flex w-full min-w-0 flex-col gap-2" : "flex flex-col gap-2"}>
        {/* Primary CTA: embedded signing only when contextual status is sign_now; otherwise view PDF only */}
        <Box className={isList ? "flex w-full min-w-0 flex-row items-stretch gap-2" : "contents"}>
          {showSignCta && handleSignNow ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSignNow(doc)}
              icon={<Icon name="pen-tool" size={16} />}
              fullWidth={!isList}
              className={primaryBtnClass}
            >
              Sign now
            </Button>
          ) : showViewSigned ? (
            <Button
              variant="success"
              size="sm"
              onClick={openAgreementViewer}
              icon={<Icon name="check-circle" size={16} />}
              fullWidth={!isList}
              className={primaryBtnClass}
            >
              View signed document
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openAgreementViewer}
              icon={<Icon name="eye" size={16} />}
              fullWidth={!isList}
              className={primaryBtnClass}
            >
              View document
            </Button>
          )}
        </Box>

        {/* Secondary actions */}
        <Box className={iconRowClass}>
          <IconButton
            variant="outline"
            size="sm"
            label={t("pdf.download")}
            onClick={() => handleDownloadDocument(doc.id, doc.filename)}
            icon={<Icon name="download" size={16} />}
            className={
              isList
                ? iconBtnBaseList
                : "border-border text-text-secondary flex-1 bg-transparent hover:bg-neutral-100 active:bg-neutral-200"
            }
          />
          <IconButton
            variant="tertiary"
            size="sm"
            label={t("saved.share_document")}
            onClick={() => handleShareDocument(doc.id, doc.filename)}
            icon={<Icon name="share" size={16} />}
            className={iconBtnShareClass}
          />
          {showDelete && onDelete && (
            <IconButton
              variant="ghost"
              size="sm"
              label={t("saved.delete_document")}
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Icon name="trash-2" size={16} />}
              className={iconBtnDeleteClass}
            />
          )}
        </Box>
      </Box>

      {showDelete && onDelete && (
        <Portal>
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title={resolvedDeleteTitle}
            message={resolvedDeleteMessage}
          />
        </Portal>
      )}
    </>
  );
}
