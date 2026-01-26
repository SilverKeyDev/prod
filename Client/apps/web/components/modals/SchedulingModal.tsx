import BaseModal from "./BaseModal";
import { SchedulingModal as SchedulingModalContent } from "../../features/dashboard/calendar/scheduling";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName?: string;
}

export default function SchedulingModal({
  isOpen,
  onClose,
  buyerName,
}: SchedulingModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Event"
      size="lg"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <SchedulingModalContent onClose={onClose} buyerName={buyerName} />
    </BaseModal>
  );
}
