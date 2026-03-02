import BaseModal from "@/components/modals/BaseModal";

import DocumentUpload from "./DocumentUpload";

type DocumentUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
};

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const handleUploadSuccess = async () => {
    if (onUploadSuccess) {
      await onUploadSuccess();
    }
    // Close modal after a brief delay to show success state
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      size="lg"
      showCloseButton
      closeOnBackdropClick
      closeOnEscape
    >
      <DocumentUpload onUploadSuccess={handleUploadSuccess} useCard={false} />
    </BaseModal>
  );
}
