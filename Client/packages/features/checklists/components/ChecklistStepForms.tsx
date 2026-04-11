/**
 * ChecklistStepForms – displays forms embedded in a checklist step.
 *
 * Forms are the primary content associated with each step (defined via
 * suggested_form_ids in the checklist definition). Both agents and clients
 * can view and download forms.
 */

import { useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistForm,
  checklistFormsApi,
  useChecklistForms,
} from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box, Text } from "packages/ui/components/primitives";

import FormCard from "./FormCard";

type ChecklistStepFormsProps = {
  transactionId: string;
  section: string;
  itemId: number;
  isAgent: boolean;
};

export default function ChecklistStepForms({
  transactionId,
  section,
  itemId,
  isAgent,
}: ChecklistStepFormsProps) {
  const { t } = useLocalization();
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(
    null,
  );

  const { forms, isLoading, error } = useChecklistForms(
    transactionId,
    section,
    itemId,
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
      const response = await checklistFormsApi.downloadForm(
        transactionId,
        section,
        itemId,
        form.id,
      );

      // eslint-disable-next-line no-restricted-globals
      window.open(response.download_url, "_blank");

      log.info(LOG_CATEGORIES.API, "Form downloaded", {
        formId: form.id,
        formKey: form.form_key,
      });
    } catch (err) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to download form", err);
    } finally {
      setDownloadingFormId(null);
    }
  };

  const handleSend = (form: ChecklistForm) => {
    log.info(LOG_CATEGORIES.API, "Send form clicked (Phase 2 stub)", {
      formId: form.id,
      formKey: form.form_key,
    });
    alert("Phase 2: Send modal will be implemented here");
  };

  if (isLoading) {
    return (
      <Box className="border-border bg-background-base rounded-lg border p-3">
        <Text className="text-text-secondary text-sm">
          {t("checklists.loading_forms", { defaultValue: "Loading forms..." })}
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="border-border bg-background-base rounded-lg border p-3">
        <Text className="text-text-error text-sm">
          {t("checklists.error_loading_forms", {
            defaultValue: "Error loading forms. Please try again.",
          })}
        </Text>
      </Box>
    );
  }

  if (forms.length === 0) {
    return (
      <Box className="border-border bg-background-base rounded-lg border p-3">
        <Text className="text-text-secondary text-sm">
          {t("checklists.no_forms_for_step", {
            defaultValue: "No forms are required for this step.",
          })}
        </Text>
      </Box>
    );
  }

  return (
    <Box className="border-border bg-background-base rounded-lg border p-3">
      <Box className="mb-3">
        <Text className="text-text-primary text-sm font-semibold">
          {t("checklists.forms_for_step", {
            defaultValue: "Forms for this step",
          })}
        </Text>
        <Text className="text-text-secondary mt-1 text-xs">
          {isAgent
            ? t("checklists.forms_description_agent", {
                defaultValue:
                  "Download forms or send them to your client via DocuSign or messaging.",
              })
            : t("checklists.forms_description_client", {
                defaultValue:
                  "Download and complete the forms below for this step.",
              })}
        </Text>
      </Box>

      <Box className="flex flex-col gap-2">
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            onDownload={() => handleDownload(form)}
            onSend={() => handleSend(form)}
            isDownloading={downloadingFormId === form.id}
            showSendButton={isAgent}
          />
        ))}
      </Box>
    </Box>
  );
}
