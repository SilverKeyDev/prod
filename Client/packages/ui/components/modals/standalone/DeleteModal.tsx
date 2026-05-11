import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Report",
  message = "Are you sure you want to delete this report? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <Box className="space-responsive-sm bg-overlay-backdrop z-modal fixed-modal-dashboard-main flex items-center justify-center">
      <Box className="space-responsive-sm bg-background-surface mx-4 w-full max-w-md rounded-xl">
        <Box className="text-center">
          <Box className="mobile-icon-lg space-y-responsive-sm bg-destructive mx-auto flex items-center justify-center rounded-full">
            <svg
              className="mobile-icon-sm text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </Box>
          <Title size="lg" as="h3" className="space-y-responsive-xs">
            {title}
          </Title>
          <BodyText size="sm" muted className="space-y-responsive-md">
            {message}
          </BodyText>
          <Box className="flex justify-center gap-4">
            <CancelButton onClick={onClose} size="md">
              {cancelText}
            </CancelButton>
            <Button type="button" variant="danger" size="md" onClick={onConfirm} iconName="trash-2">
              {confirmText}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default DeleteModal;
export { DeleteModal };
