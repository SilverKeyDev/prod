import React from "react";

import type { SharedChecklistFormSnapshot } from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { BodyText, Button } from "@/components/ui";
import { isChecklistFormMessagingAttachmentUnavailable } from "@/features/messaging/utils/messagingAttachmentAvailability";

export type ChecklistFormMessagingCardProps = {
  form: SharedChecklistFormSnapshot;
  formsLibraryLoading: boolean;
  formsLibraryError: Error | null;
  checklistFormIdsInLibrary: Set<string> | null;
  t: (key: string) => string;
};

export function ChecklistFormMessagingCard({
  form,
  formsLibraryLoading,
  formsLibraryError,
  checklistFormIdsInLibrary,
  t,
}: ChecklistFormMessagingCardProps) {
  const formUnavailable = isChecklistFormMessagingAttachmentUnavailable(form, {
    formsLibraryLoading,
    formsLibraryError,
    checklistFormIdsInLibrary,
  });
  const formTitle = form.title?.trim() || form.form_key;

  if (formUnavailable) {
    return (
      <Box className="border-border bg-background-surface mb-2 w-full min-w-0 max-w-full rounded-lg border border-dashed p-4">
        <BodyText as="p" size="xs" className="text-text-secondary font-medium">
          {t("agent.shared_checklist_form_label")}
        </BodyText>
        <BodyText as="p" size="sm" className="text-text-primary mt-1 font-medium">
          {formTitle}
        </BodyText>
        <BodyText as="p" size="sm" className="text-text-secondary mt-2 font-semibold">
          {t("agent.messaging_form_deleted_title")}
        </BodyText>
        <BodyText as="p" size="xs" muted className="mt-1">
          {t("agent.messaging_form_deleted_body")}
        </BodyText>
      </Box>
    );
  }

  return (
    <Box className="border-border bg-primary-muted mb-2 w-full min-w-0 max-w-full rounded-lg border p-4">
      <BodyText as="p" size="xs" className="text-text-secondary font-medium">
        {t("agent.shared_checklist_form_label")}
      </BodyText>
      <BodyText as="p" size="sm" className="text-text-primary mt-1 font-medium">
        {formTitle}
      </BodyText>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        label={t("agent.open_checklist_form_pdf")}
        onPress={() => {
          const url = form.download_url;
          if (url) {
            getWindow()?.open?.(url, "_blank", "noopener,noreferrer");
          }
        }}
      >
        {t("agent.open_checklist_form_pdf")}
      </Button>
    </Box>
  );
}
