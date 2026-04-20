/**
 * FormsLibraryTab - Full forms library view for Documents page.
 * Shows all forms organized by category with download options.
 */

import { useLocalization } from "packages/contexts";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import { Box } from "packages/ui/components/primitives";

import { Subtitle, Title } from "@/components/ui";

import FormsBrowser from "./FormsBrowser";

type FormsLibraryTabProps = {
  onSendForSignature?: (form: ChecklistForm) => void;
};

export default function FormsLibraryTab({ onSendForSignature }: FormsLibraryTabProps) {
  const { t } = useLocalization();

  const handleSendForSignature = (form: ChecklistForm) => {
    if (onSendForSignature) {
      onSendForSignature(form);
    }
  };

  return (
    <Box className="w-full">
      <Box className="mb-4">
        <Title as="h2" size="md" className="mb-2">
          {t("forms.library_title", { defaultValue: "Forms Library" })}
        </Title>
        <Subtitle size="sm" className="text-text-secondary">
          {t("forms.library_description", {
            defaultValue:
              "Browse and download pre-filled forms. Select a category to view available forms, or download directly.",
          })}
        </Subtitle>
      </Box>

      <FormsBrowser
        onSendForSignature={onSendForSignature ? handleSendForSignature : undefined}
        showActions
      />
    </Box>
  );
}
