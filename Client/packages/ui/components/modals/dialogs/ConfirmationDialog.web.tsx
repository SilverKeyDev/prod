import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import { Portal } from "packages/ui/components/portal";

import { BodyText, Button, CancelButton, CloseButton, Title } from "@/components/ui";

import type { ConfirmationDialogProps } from "./ConfirmationDialog.types";
type ConfirmationDialogContentProps = Omit<ConfirmationDialogProps, "isOpen"> & {
  showLogoutIcon: boolean;
};
function ConfirmationDialogContent({
  title,
  message,
  confirmText,
  cancelText,
  confirmIcon,
  showLogoutIcon,
  onConfirm,
  onCancel,
}: ConfirmationDialogContentProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        <div
          role="button"
          tabIndex={0}
          className="bg-overlay-backdrop fixed inset-0 transition-opacity"
          onClick={onCancel}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <div
          className="space-responsive-lg relative z-50 mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: spacing(80) }}
        >
          <CloseButton
            onClick={onCancel}
            size="sm"
            className="absolute right-2 top-2"
            aria-label="Close dialog"
          />
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
          <div className="gap-responsive-sm mt-5 flex flex-col justify-center sm:mt-6 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onConfirm}
              className="w-full sm:w-auto"
              icon={confirmIcon ?? (showLogoutIcon ? <Icon name="log-out" /> : undefined)}
            >
              {confirmText}
            </Button>
            <CancelButton onClick={onCancel} size="md" className="w-full sm:w-auto">
              {cancelText}
            </CancelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ConfirmationDialog(props: ConfirmationDialogProps) {
  const {
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmIcon,
    onConfirm,
    onCancel,
  } = props;
  const showLogoutIcon = confirmText === "Logout";
  if (!isOpen) return null;
  return (
    <Portal>
      <ConfirmationDialogContent
        title={title}
        message={message}
        confirmText={confirmText}
        cancelText={cancelText}
        confirmIcon={confirmIcon}
        showLogoutIcon={showLogoutIcon}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Portal>
  );
}
