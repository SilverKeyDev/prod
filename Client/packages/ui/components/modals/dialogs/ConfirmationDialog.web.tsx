import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import CloseButton from "packages/ui/components/button/CloseButton";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

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
    <Box className="z-modal fixed-modal-dashboard-main overflow-y-auto">
      <Box className="space-responsive-md flex min-h-screen w-full items-center justify-center">
        <Box
          role="button"
          tabIndex={0}
          className="bg-overlay-backdrop fixed-modal-dashboard-main transition-opacity"
          onClick={onCancel}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <Box
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
              <Title size="lg" as="h3">
                {title}
              </Title>
              <Box className="mt-2">
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
              icon={confirmIcon ?? <Icon name={showLogoutIcon ? "log-out" : "check"} />}
            >
              {confirmText}
            </Button>
            <CancelButton
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
