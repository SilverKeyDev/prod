import CancelButton from "packages/ui/components/button/CancelButton";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

export type CreateAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateAgreementModal({ isOpen, onClose }: CreateAgreementModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create agreement" size="md">
      <Box className="space-y-4 py-2">
        <BodyText size="sm" muted>
          Start new agreements from the Saved page documents view, where you can pick a template and
          recipients.
        </BodyText>
        <Box className="flex justify-end gap-2">
          <CancelButton onClick={onClose} size="md">
            Close
          </CancelButton>
        </Box>
      </Box>
    </BaseModal>
  );
}
