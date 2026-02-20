import React from "react";

import { BaseModal } from "@/components/ui/index.web";
import Settings from "@/features/agent/settings/Settings";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
        <Settings />
      </div>
    </BaseModal>
  );
}
