import { BodyText, Button, CancelButton, Title } from "@/components/ui";

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
    <div className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="space-responsive-sm mx-4 w-full max-w-md rounded-xl bg-white">
        <div className="text-center">
          <div className="mobile-icon-lg space-y-responsive-sm mx-auto flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="mobile-icon-sm text-red-600"
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
          </div>
          <Title size="lg" as="h3" className="space-y-responsive-xs">
            {title}
          </Title>
          <BodyText size="sm" muted className="space-y-responsive-md">
            {message}
          </BodyText>
          <div className="flex justify-center gap-4">
            <CancelButton onClick={onClose} size="md">
              {cancelText}
            </CancelButton>
            <Button type="button" variant="danger" size="md" onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;
export { DeleteModal };
