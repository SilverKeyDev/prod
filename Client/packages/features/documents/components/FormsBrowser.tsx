/**
 * FormsBrowser - Browse and select forms from the forms library.
 * Shows categories (folders) and forms within each category.
 */

import { useState } from "react";

import { useLocalization } from "packages/contexts";
import { useFormsLibrary } from "packages/features/documents/hooks/data/useFormsLibrary";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { Icon } from "packages/ui/components/icons";
import { Box, Text } from "packages/ui/components/primitives";

type FormsBrowserProps = {
  onSelectForm: (form: ChecklistForm) => void;
  onClose?: () => void;
  showActions?: boolean; // Show download/attach buttons (default: true)
  onSendForSignature?: (form: ChecklistForm) => void; // Send form for signature
};

export default function FormsBrowser({
  onSelectForm,
  onClose,
  showActions = true,
  onSendForSignature,
}: FormsBrowserProps) {
  const { t } = useLocalization();
  const { categories, isLoading, error } = useFormsLibrary();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(
    null,
  );

  const handleDownload = async (form: ChecklistForm) => {
    if (!form.download_url) {
      log.error(LOG_CATEGORIES.ERRORS, "Form has no download URL", {
        formId: form.id,
      });
      return;
    }

    setDownloadingFormId(form.id);
    try {
      // Open download URL in new tab (agent-only, web-only context)
      // eslint-disable-next-line no-restricted-globals
      window.open(form.download_url, "_blank");

      log.info(LOG_CATEGORIES.API, "Form downloaded from library", {
        formId: form.id,
        formKey: form.form_key,
      });
    } catch (err) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to download form", err);
    } finally {
      setDownloadingFormId(null);
    }
  };

  const handleSelectForm = (form: ChecklistForm) => {
    log.info(LOG_CATEGORIES.API, "Form selected from library", {
      formId: form.id,
      formKey: form.form_key,
    });
    onSelectForm(form);
  };

  if (isLoading) {
    return (
      <Box className="p-4">
        <Text className="text-text-secondary text-sm">
          {t("forms.loading_library", { defaultValue: "Loading forms..." })}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4">
        <Text className="text-text-error text-sm">
          {t("forms.error_loading_library", {
            defaultValue: "Error loading forms. Please try again.",
          })}
        </Text>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box className="p-4">
        <Text className="text-text-secondary text-sm">
          {t("forms.no_forms_available", {
            defaultValue:
              "No forms available. Forms will be added by your administrator.",
          })}
        </Text>
      </Box>
    );
  }

  // Category list view
  if (!selectedCategory) {
    return (
      <Box className="p-4">
        <Box className="mb-3">
          <Text className="text-text-primary mb-1 text-sm font-semibold">
            {t("forms.select_category", { defaultValue: "Select a category" })}
          </Text>
          <Text className="text-text-secondary text-xs">
            {t("forms.category_description", {
              defaultValue: "Choose a folder to browse available forms.",
            })}
          </Text>
        </Box>

        <Box className="flex flex-col gap-2">
          {categories.map((category) => (
            <Box
              key={category.name}
              className="border-border hover:bg-background-surface cursor-pointer rounded-md border p-3 transition-colors"
              onClick={() => setSelectedCategory(category.name)}
            >
              <Box className="flex flex-row items-center justify-between">
                <Box>
                  <Text className="text-text-primary text-sm font-medium capitalize">
                    {category.name}
                  </Text>
                  <Text className="text-text-secondary text-xs">
                    {category.forms.length}{" "}
                    {category.forms.length === 1
                      ? t("forms.form", { defaultValue: "form" })
                      : t("forms.forms", { defaultValue: "forms" })}
                  </Text>
                </Box>
                <Text className="text-text-tertiary text-xs">→</Text>
              </Box>
            </Box>
          ))}
        </Box>

        {onClose && (
          <Box className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onPress={onClose}
              label="Close"
            >
              {t("common.close", { defaultValue: "Close" })}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Forms list view (selected category)
  const category = categories.find((c) => c.name === selectedCategory);
  if (!category) {
    return null;
  }

  return (
    <Box className="p-4">
      <Box className="mb-3 flex flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setSelectedCategory(null)}
          label="Back"
        >
          ← {t("common.back", { defaultValue: "Back" })}
        </Button>
      </Box>

      <Box className="mb-3">
        <Text className="text-text-primary mb-1 text-sm font-semibold capitalize">
          {category.name}
        </Text>
        <Text className="text-text-secondary text-xs">
          {category.forms.length}{" "}
          {category.forms.length === 1
            ? t("forms.form_available", { defaultValue: "form available" })
            : t("forms.forms_available", { defaultValue: "forms available" })}
        </Text>
      </Box>

      <Box className="flex flex-col gap-2">
        {category.forms.map((form) => (
          <Box
            key={form.id}
            className="border-border bg-background-surface rounded-md border p-3"
          >
            <Box className="mb-2">
              <Text className="text-text-primary mb-1 text-sm font-semibold">
                {form.title}
              </Text>
              {form.description && (
                <Text className="text-text-secondary text-xs">
                  {form.description}
                </Text>
              )}
            </Box>

            {showActions && (
              <Box className="flex flex-col gap-2">
                <Box className="flex flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleDownload(form)}
                    disabled={downloadingFormId === form.id}
                    label={
                      downloadingFormId === form.id
                        ? "Downloading..."
                        : "Download"
                    }
                  >
                    {downloadingFormId === form.id
                      ? "Downloading..."
                      : "Download"}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleSelectForm(form)}
                    label="Use This Form"
                  >
                    {t("forms.use_form", { defaultValue: "Use This Form" })}
                  </Button>
                </Box>

                {onSendForSignature && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => onSendForSignature(form)}
                    icon={<Icon name="file-signature" size={16} />}
                    fullWidth
                    className="justify-center"
                    label="Send for Signature"
                  >
                    {t("forms.send_for_signature", {
                      defaultValue: "Send for Signature",
                    })}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
