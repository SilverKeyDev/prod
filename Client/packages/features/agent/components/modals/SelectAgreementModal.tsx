import BaseModal from "@/components/modals/BaseModal";
import { BodyText, Button, CancelButton, CloseButton, Title } from "@/components/ui";

type Agreement = {
  title?: string;
};

type SelectAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (agreement: Agreement) => void;
  clientId?: string;
};

/**
 * Web-only placeholder.
 *
 * The agreements domain lives under Documents. This modal exists as a
 * lightweight bridge so Messaging can compile without creating tight coupling.
 */
export default function SelectAgreementModal({
  isOpen,
  onClose,
  onSelect,
  clientId: _clientId,
}: SelectAgreementModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Title size="lg">Select Agreement</Title>
          <CloseButton onClick={onClose} />
        </div>

        <BodyText size="sm" muted>
          Agreement selection is currently managed in the Documents experience.
        </BodyText>

        <div className="flex justify-end gap-3">
          <CancelButton onClick={onClose}>Close</CancelButton>
          <Button type="button" variant="primary" onClick={() => onSelect({ title: "Agreement" })}>
            Share placeholder
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
