import { useEffect, useId, useRef } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { spacing } from "packages/design-tokens";
import Button from "packages/ui/components/actions/button/Button";
import CancelButton from "packages/ui/components/actions/button/CancelButton";
import CloseButton from "packages/ui/components/actions/button/core/CloseButton";
import { Portal } from "packages/ui/components/structure/portal";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { getDocument } from "packages/utils/core/platform";

import type { ConfirmationDialogProps } from "./ConfirmationDialog.types";

type ConfirmationDialogContentProps = Omit<ConfirmationDialogProps, "isOpen"> & {
  titleId: string;
  messageId: string;
  confirmText: string;
  cancelText: string;
};

function ConfirmationDialogContent({
  title,
  message,
  confirmText,
  cancelText,
  confirmIcon,
  onConfirm,
  onCancel,
  titleId,
  messageId,
}: ConfirmationDialogContentProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  // Initial focus on the safe action (matches Radix AlertDialog default for destructive flows).
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Escape-to-close while the dialog is mounted.
  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCancel();
      }
    };
    doc.addEventListener("keydown", handleKeyDown);
    return () => doc.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <Box className="z-modal fixed-modal-dashboard-main overflow-y-auto">
      <Box className="space-responsive-md flex min-h-screen w-full items-center justify-center">
        <Box
          aria-hidden="true"
          className="bg-overlay-backdrop fixed-modal-dashboard-main cursor-pointer transition-opacity"
          onClick={onCancel}
        />
        <Box
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          className="space-responsive-lg z-modal relative mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: spacing(80) }}
        >
          <CloseButton
            onClick={onCancel}
            size="sm"
            className="absolute right-2 top-2"
            aria-label="Close dialog"
          />
          <Box className="flex items-start justify-center">
            <Box className="mt-3 w-full text-center">
              <Title size="lg" as="h3" id={titleId}>
                {title}
              </Title>
              <Box className="mt-2" id={messageId}>
                <BodyText size="sm" muted>
                  {message}
                </BodyText>
              </Box>
            </Box>
          </Box>
          <Box className="gap-responsive-sm mt-5 flex flex-col justify-center sm:mt-6 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="w-full shrink-0 sm:w-auto"
              truncateLabel={false}
              icon={confirmIcon ?? <Icon name="check" />}
            >
              {confirmText}
            </Button>
            <CancelButton
              ref={cancelButtonRef}
              onClick={onCancel}
              size="md"
              className="w-full shrink-0 sm:w-auto"
              truncateLabel={false}
            >
              {cancelText}
            </CancelButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { t } = useLocalization();
  const generatedId = useId();
  const titleId = `confirm-dialog-title-${generatedId}`;
  const messageId = `confirm-dialog-message-${generatedId}`;
  const { isOpen, title, message, confirmText, cancelText, confirmIcon, onConfirm, onCancel } =
    props;
  if (!isOpen) return null;
  const resolvedConfirmText = confirmText ?? t("common.confirm");
  const resolvedCancelText = cancelText ?? t("common.cancel");
  return (
    <Portal>
      <ConfirmationDialogContent
        title={title}
        message={message}
        confirmText={resolvedConfirmText}
        cancelText={resolvedCancelText}
        confirmIcon={confirmIcon}
        onConfirm={onConfirm}
        onCancel={onCancel}
        titleId={titleId}
        messageId={messageId}
      />
    </Portal>
  );
}
