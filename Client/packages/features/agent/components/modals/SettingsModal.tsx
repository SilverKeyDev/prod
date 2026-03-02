import React from "react";

import { useNavigation } from "packages/navigation";
import { BaseModal } from "packages/ui/components/index.web";
import { BodyText, Button, Title } from "packages/ui/components/index.web";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { navigateToPath } = useNavigation();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      className="max-h-[95vh]"
      closeOnBackdropClick={false}
      showHeaderBorder={false}
      contentBackground="off-white"
    >
      <div className="h-full overflow-y-auto">
        <div className="space-y-4 p-6">
          <Title size="lg" as="h2">
            Settings
          </Title>
          <BodyText size="sm" muted>
            Settings are managed on the Profile page.
          </BodyText>
          <Button
            variant="primary"
            onClick={() => {
              navigateToPath("/profile", { replace: false });
              onClose();
            }}
          >
            Open Profile Settings
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
