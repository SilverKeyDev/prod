/**
 * ChecklistStepForms – agent-only forms for a checklist step (suggested_form_ids).
 * Clients receive PDFs when the agent sends a form via messaging.
 */

import { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { ChecklistFormsCardVariant } from "packages/features/checklists/utils/rules/getFormsCardVariant";
import {
  type ChecklistForm,
  checklistFormsApi,
  useChecklistForms,
} from "packages/features/documents";
import { useChecklistFormSendContext } from "packages/hooks/data";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import type { DocumentData } from "packages/ui/components/cards/document/types";
import { Box, Text } from "packages/ui/components/primitives";

import FormCard from "./FormCard";

function checklistFormToSyntheticDocument(form: ChecklistForm): DocumentData {
  return {
    id: form.id,
    filename: `${form.form_key}.pdf`,
    file_path: form.s3_template_path,
    status: "template",
    created_at: form.deadline ?? null,
    updated_at: null,
    user_id: "",
    document_type: form.category ?? "Form",
    address: null,
  };
}

type ChecklistStepFormsProps = {
  transactionId: string;
  section: string;
  itemId: number;
  isAgent: boolean;
  formsCardVariant?: ChecklistFormsCardVariant;
};

export default function ChecklistStepForms({
  transactionId,
  section,
  itemId,
  isAgent,
  formsCardVariant = "default",
}: ChecklistStepFormsProps) {
  const { t } = useLocalization();
  const [downloadingFormId, setDownloadingFormId] = useState<string | null>(null);
  const [sendingFormId, setSendingFormId] = useState<string | null>(null);

  const hubClientId = transactionId;
  const { conversationId: conversationIdResolved } = useChecklistFormSendContext(hubClientId);

  const { forms, isLoading, error } = useChecklistForms(transactionId, section, itemId, isAgent);

  const openDownloadUrl = useCallback((form: ChecklistForm) => {
    if (!form.download_url) return;
    // eslint-disable-next-line no-restricted-globals
    window.open(form.download_url, "_blank", "noopener,noreferrer");
  }, []);

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
        form.id
      );

      // eslint-disable-next-line no-restricted-globals
      window.open(response.download_url, "_blank", "noopener,noreferrer");

      log.info(LOG_CATEGORIES.API, "Form downloaded", {
        formId: form.id,
        formKey: form.form_key,
      });
    } catch (err) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to download form", err);
      showErrorToast(
        t("checklists.download_form_error", {
          defaultValue: "Could not download the form. Please try again.",
        })
      );
    } finally {
      setDownloadingFormId(null);
    }
  };

  const handleSend = useCallback(
    async (form: ChecklistForm) => {
      const existingId = conversationIdResolved;
      const payload = {
        method: "messaging" as const,
        conversation_id: existingId ?? "new",
        ...(existingId ? {} : { client_id: hubClientId }),
      };

      setSendingFormId(form.id);
      try {
        const res = await checklistFormsApi.sendForm(
          transactionId,
          section,
          itemId,
          form.id,
          payload
        );
        if (!res.success) {
          showErrorToast(
            res.error ??
              t("checklists.send_form_error", {
                defaultValue: "Could not send the form. Try again or open Messaging.",
              })
          );
          return;
        }
        showSuccessToast(
          t("checklists.send_form_success", {
            defaultValue: "Form sent to your client.",
          })
        );
        log.info(LOG_CATEGORIES.API, "Checklist form sent via messaging", {
          formId: form.id,
          messageId: res.message_id,
        });
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Failed to send checklist form", err);
        showErrorToast(
          t("checklists.send_form_error", {
            defaultValue: "Could not send the form. Try again or open Messaging.",
          })
        );
      } finally {
        setSendingFormId(null);
      }
    },
    [conversationIdResolved, hubClientId, itemId, section, t, transactionId]
  );

  const documentCardHandlers = useCallback(
    (form: ChecklistForm) => ({
      handleViewDocument: (_documentId: string, _documentName: string) => {
        openDownloadUrl(form);
      },
      handleDownloadDocument: async (_documentId: string, _documentName: string) => {
        openDownloadUrl(form);
      },
      handleShareDocument: async (_documentId: string, _documentName: string) => {
        openDownloadUrl(form);
        return { success: true as const, message: "" };
      },
      isAgent: true,
    }),
    [openDownloadUrl]
  );

  if (!isAgent) {
    return null;
  }

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
          {t("checklists.forms_description_agent", {
            defaultValue: "Download forms or send them to your client in Messaging.",
          })}
        </Text>
      </Box>

      <Box className="flex flex-col gap-3">
        {forms.map((form) =>
          formsCardVariant === "document" ? (
            <Box key={form.id} className="flex flex-col gap-2">
              <DocumentCard
                doc={checklistFormToSyntheticDocument(form)}
                showDelete={false}
                externalActionHandlers={documentCardHandlers(form)}
              />
              <FormCard
                form={form}
                onDownload={() => handleDownload(form)}
                onSend={() => void handleSend(form)}
                isDownloading={downloadingFormId === form.id}
                isSending={sendingFormId === form.id}
                showSendButton
                sendOnlyRow
              />
            </Box>
          ) : (
            <FormCard
              key={form.id}
              form={form}
              onDownload={() => handleDownload(form)}
              onSend={() => void handleSend(form)}
              isDownloading={downloadingFormId === form.id}
              isSending={sendingFormId === form.id}
              showSendButton
            />
          )
        )}
      </Box>
    </Box>
  );
}
