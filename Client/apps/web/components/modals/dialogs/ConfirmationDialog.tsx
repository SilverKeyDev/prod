import { createPortal } from "react-dom";

import { BodyText, Button, CancelButton, CloseButton, Title } from "../../ui";

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <div
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="space-responsive-lg relative z-[10000] mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: "320px" }}
        >
          {/* Close button */}
          <CloseButton
            onClick={onCancel}
            size="sm"
            className="absolute right-2 top-2"
            aria-label="Close dialog"
          />

          {/* Content */}
          <div className="flex items-start justify-center">
            <div className="mt-3 w-full text-center">
              <Title size="lg" as="h3">
                {title}
              </Title>
              <div className="mt-2">
                <BodyText size="sm" muted>
                  {message}
                </BodyText>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="gap-responsive-sm mt-5 flex flex-col justify-center sm:mt-6 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="w-full sm:w-auto"
            >
              {confirmText}
            </Button>
            <CancelButton
              onClick={onCancel}
              size="md"
              className="w-full sm:w-auto"
            >
              {cancelText}
            </CancelButton>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the dialog using a portal to ensure it appears at the document root level
  return createPortal(dialogContent, document.body);
}
