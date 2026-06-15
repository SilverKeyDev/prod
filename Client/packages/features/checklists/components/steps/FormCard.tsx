/**
 * FormCard - displays a single checklist form with download and send actions.
 */

import { useLocalization } from "packages/contexts";
import type { ChecklistForm } from "packages/features/documents";
import { Button } from "packages/ui";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { dateParse } from "packages/utils/core/date";

type FormCardProps = {
  form: ChecklistForm;
  onDownload: () => void;
  onSend: () => void;
  isDownloading?: boolean;
  isSending?: boolean;
  /** Only agents can send forms to clients; hide button for client users. */
  showSendButton?: boolean;
  /** When true, only the send button row (used below SharedDocumentCard). */
  sendOnlyRow?: boolean;
};

export default function FormCard({
  form,
  onDownload,
  onSend,
  isDownloading = false,
  isSending = false,
  showSendButton = false,
  sendOnlyRow = false,
}: FormCardProps) {
  const { t } = useLocalization();
  const sendLabel = t("checklists.send_form_to_client", {
    defaultValue: "Send to client",
  });
  const sendingLabel = t("checklists.sending_form", {
    defaultValue: "Sending...",
  });

  if (sendOnlyRow) {
    return (
      <Box className="flex flex-row flex-wrap gap-2">
        {showSendButton ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={onSend}
            disabled={isSending || !form.download_url}
            label={isSending ? sendingLabel : sendLabel}
            iconName="send"
          >
            {isSending ? sendingLabel : sendLabel}
          </Button>
        ) : null}
      </Box>
    );
  }

  return (
    <Box className="border-border bg-background-surface rounded-md border p-3">
      <Box className="mb-2">
        <Text className="text-text-primary mb-1 text-sm font-semibold">{form.title}</Text>
        {form.description ? (
          <Text className="text-text-secondary text-xs">{form.description}</Text>
        ) : null}
        {form.deadline ? (
          <Text className="text-text-tertiary mt-1 text-xs">
            {t("checklists.due_label", { defaultValue: "Due" })}:{" "}
            {dateParse(form.deadline).toLocaleDateString()}
          </Text>
        ) : null}
      </Box>

      <Box className="flex flex-row flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onPress={onDownload}
          disabled={isDownloading || !form.download_url}
          label={isDownloading ? "Downloading..." : "Download"}
          iconName="download"
        >
          {isDownloading ? "Downloading..." : "Download"}
        </Button>

        {showSendButton ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={onSend}
            disabled={isSending || !form.download_url}
            label={isSending ? sendingLabel : sendLabel}
            iconName="send"
          >
            {isSending ? sendingLabel : sendLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
