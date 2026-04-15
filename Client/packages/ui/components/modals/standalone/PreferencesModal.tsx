import React, { useCallback, useRef } from "react";

import BaseModal from "@/components/modals/BaseModal";
import PreferencesFormContent, {
  type PreferencesFormContentRef,
} from "@/features/profile/components/settings/inputs/PreferencesFormContent.web";
import type { OnboardingData } from "@/features/profile/utils";

type PreferencesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChanged?: () => void | Promise<void>;
};

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesChanged,
}) => {
  const formContentRef = useRef<PreferencesFormContentRef | null>(null);
  const initialFormDataRef = useRef<string>("");

  const handleInitialSnapshot = useCallback(
    (formData: Partial<OnboardingData>) => {
      initialFormDataRef.current = JSON.stringify(formData);
    },
    [],
  );

  const handleClose = useCallback(async () => {
    const current = formContentRef.current;
    const currentStr = current ? JSON.stringify(current.formData) : "";
    const hasChanged = currentStr !== initialFormDataRef.current;
    onClose();
    if (hasChanged && onPreferencesChanged) {
      await onPreferencesChanged();
    }
  }, [onClose, onPreferencesChanged]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Preferences"
      size="xl"
      className="max-h-[90vh]"
    >
      <PreferencesFormContent
        key={isOpen ? "open" : "closed"}
        formContentRef={formContentRef}
        showErrorToastOnError={false}
        onInitialSnapshot={handleInitialSnapshot}
      />
    </BaseModal>
  );
};

export default PreferencesModal;
