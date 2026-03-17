import { Box } from "packages/ui/components/primitives";

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
      <Box className="flex flex-col gap-4">
        <Box className="flex items-center justify-between">
          <Title size="lg">Select Agreement</Title>
          <CloseButton onClick={onClose} />
        </Box>

        <BodyText size="sm" muted>
          Agreement selection is currently managed in the Documents experience.
        </BodyText>

        <Box className="flex justify-end gap-3">
          <CancelButton onClick={onClose}>Close</CancelButton>
          <Button type="button" variant="primary" onClick={() => onSelect({ title: "Agreement" })}>
            Share placeholder
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
