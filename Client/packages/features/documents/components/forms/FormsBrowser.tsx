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
import { Box } from "packages/ui/components/primitives";
import { formatFormsLibraryCategoryLabel } from "packages/utils/documents";

import { BodyText, Subtitle, Title } from "@/components/ui";

type FormsBrowserProps = {
  /** When provided with `showActions={false}` (e.g. upload modal), tapping a form card selects it. */
  onSelectForm?: (form: ChecklistForm) => void;
  onClose?: () => void;
  showActions?: boolean; // Show download / send-for-signature controls (default: true)
  onSendForSignature?: (form: ChecklistForm) => void;
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
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <Box className="p-4">
        <BodyText size="sm" muted>
          {t("forms.loading_library", { defaultValue: "Loading forms..." })}
        </BodyText>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4">
        <BodyText size="sm" className="text-destructive">
          {t("forms.error_loading_library", {
            defaultValue: "Error loading forms. Please try again.",
          })}
        </BodyText>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box className="p-4">
        <BodyText size="sm" muted>
          {t("forms.no_forms_available", {
            defaultValue: "No forms available. Forms will be added by your administrator.",
          })}
        </BodyText>
      </Box>
    );
  }

  // Category list view
  if (!selectedCategory) {
    return (
      <Box className="p-4">
        <Box className="mb-3">
          <Title as="h3" size="sm" className="mb-1">
            {t("forms.select_category", { defaultValue: "Select a category" })}
          </Title>
          <Subtitle size="xs" className="text-text-secondary">
            {t("forms.category_description", {
              defaultValue: "Choose a folder to browse available forms.",
            })}
          </Subtitle>
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
                  <BodyText as="p" size="sm" className="text-text-primary font-medium">
                    {formatFormsLibraryCategoryLabel(category.name)}
                  </BodyText>
                  <BodyText as="p" size="xs" muted>
                    {category.forms.length}{" "}
                    {category.forms.length === 1
                      ? t("forms.form", { defaultValue: "form" })
                      : t("forms.forms", { defaultValue: "forms" })}
                  </BodyText>
                </Box>
                <BodyText as="span" size="xs" muted>
                  →
                </BodyText>
              </Box>
            </Box>
          ))}
        </Box>

        {onClose && (
          <Box className="mt-4">
            <Button variant="secondary" size="sm" onPress={onClose} label="Close" iconName="x">
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
          iconName="home"
        >
          ← {t("common.back", { defaultValue: "Back" })}
        </Button>
      </Box>

      <Box className="mb-3">
        <Title as="h3" size="sm" className="mb-1">
          {formatFormsLibraryCategoryLabel(category.name)}
        </Title>
        <Subtitle size="xs" className="text-text-secondary">
          {category.forms.length}{" "}
          {category.forms.length === 1
            ? t("forms.form_available", { defaultValue: "form available" })
            : t("forms.forms_available", { defaultValue: "forms available" })}
        </Subtitle>
      </Box>

      <Box className="flex flex-col gap-2">
        {category.forms.map((form) => {
          const cardSelectable = Boolean(onSelectForm) && !showActions;
          return (
            <Box
              key={form.id}
              role={cardSelectable ? "button" : undefined}
              tabIndex={cardSelectable ? 0 : undefined}
              className={`border-border bg-background-surface flex flex-col gap-3 rounded-md border p-3 ${
                cardSelectable ? "cursor-pointer transition-colors hover:bg-neutral-50" : ""
              }`}
              onClick={
                cardSelectable
                  ? () => {
                      log.info(LOG_CATEGORIES.API, "Form selected from library", {
                        formId: form.id,
                        formKey: form.form_key,
                      });
                      onSelectForm?.(form);
                    }
                  : undefined
              }
              onKeyDown={
                cardSelectable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        log.info(LOG_CATEGORIES.API, "Form selected from library", {
                          formId: form.id,
                          formKey: form.form_key,
                        });
                        onSelectForm?.(form);
                      }
                    }
                  : undefined
              }
            >
              <Box className="min-w-0">
                <Title as="h4" size="sm" className="mb-1">
                  {form.title}
                </Title>
                {form.description ? (
                  <BodyText as="p" size="xs" muted>
                    {form.description}
                  </BodyText>
                ) : null}
              </Box>

              {showActions && (
                <Box
                  className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    loading={downloadingFormId === form.id}
                    onPress={() => handleDownload(form)}
                    disabled={!form.download_url || downloadingFormId === form.id}
                    icon={<Icon name="download" size={16} />}
                    className="w-full sm:min-w-0 sm:flex-1"
                    label={
                      downloadingFormId === form.id
                        ? t("forms.downloading", {
                            defaultValue: "Downloading…",
                          })
                        : t("forms.download", { defaultValue: "Download" })
                    }
                  >
                    {downloadingFormId === form.id
                      ? t("forms.downloading", {
                          defaultValue: "Downloading…",
                        })
                      : t("forms.download", { defaultValue: "Download" })}
                  </Button>

                  {onSendForSignature ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => onSendForSignature(form)}
                      icon={<Icon name="file-signature" size={16} />}
                      className="w-full sm:min-w-0 sm:flex-1"
                      label="Send for Signature"
                    >
                      {t("forms.send_for_signature", {
                        defaultValue: "Send for Signature",
                      })}
                    </Button>
                  ) : null}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
