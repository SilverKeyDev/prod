/**
 * FormsLibraryTab - Full forms library view for Documents page.
 * Shows all forms organized by category with download options.
 */

import { useLocalization } from "packages/contexts";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import { Box, Text } from "packages/ui/components/primitives";

import FormsBrowser from "./FormsBrowser";

type FormsLibraryTabProps = {
  onSelectForm?: (form: ChecklistForm) => void;
  onSendForSignature?: (form: ChecklistForm) => void;
};

export default function FormsLibraryTab({
  onSelectForm,
  onSendForSignature,
}: FormsLibraryTabProps) {
  const { t } = useLocalization();

  const handleSelectForm = (form: ChecklistForm) => {
    if (onSelectForm) {
      onSelectForm(form);
    }
  };

  const handleSendForSignature = (form: ChecklistForm) => {
    if (onSendForSignature) {
      onSendForSignature(form);
    }
  };

  return (
    <Box className="w-full">
      <Box className="mb-4">
        <Text className="text-text-primary mb-2 text-lg font-semibold">
          {t("forms.library_title", { defaultValue: "Forms Library" })}
        </Text>
        <Text className="text-text-secondary text-sm">
          {t("forms.library_description", {
            defaultValue:
              "Browse and download pre-filled forms. Select a category to view available forms, or download directly.",
          })}
        </Text>
      </Box>

      <FormsBrowser
        onSelectForm={handleSelectForm}
        onSendForSignature={
          onSendForSignature ? handleSendForSignature : undefined
        }
        showActions
      />
    </Box>
  );
}
