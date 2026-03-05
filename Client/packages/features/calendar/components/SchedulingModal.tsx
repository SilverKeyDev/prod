import { BodyText } from "packages/ui/components/index.web";
import BaseModal from "packages/ui/components/modals/BaseModal";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerName?: string;
}

export default function SchedulingModal({ isOpen, onClose, buyerName }: SchedulingModalProps) {
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
      <BodyText size="sm" muted>
        Use Calendar to choose a time and schedule an event.
        {buyerName ? ` You can schedule with ${buyerName}.` : ""}
      </BodyText>
    </BaseModal>
  );
}
