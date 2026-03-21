import React from "react";

import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Cover } from "@/components/ui";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { navigateToPath } = useNavigation();
  return (
    <Cover
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      showHeaderBorder={false}
    >
      <Box className="space-y-4">
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
      </Box>
    </Cover>
  );
}
