/**
 * FormCard - displays a single checklist form with download and send actions.
 */

import type { ChecklistForm } from "packages/features/documents";
import Button from "packages/ui/components/button/Button";
import { Box, Text } from "packages/ui/components/primitives";
import { dateParse } from "packages/utils/date";

type FormCardProps = {
  form: ChecklistForm;
  onDownload: () => void;
  onSend: () => void;
  isDownloading?: boolean;
  /** Only agents can send forms to clients; hide button for client users. */
  showSendButton?: boolean;
};

export default function FormCard({
  form,
  onDownload,
  onSend,
  isDownloading = false,
  showSendButton = false,
}: FormCardProps) {
  return (
    <Box className="border-border bg-background-surface rounded-md border p-3">
      <Box className="mb-2">
        <Text className="text-text-primary mb-1 text-sm font-semibold">
          {form.title}
        </Text>
        {form.description && (
          <Text className="text-text-secondary text-xs">
            {form.description}
          </Text>
        )}
        {form.deadline && (
          <Text className="text-text-tertiary mt-1 text-xs">
            Deadline: {dateParse(form.deadline).toLocaleDateString()}
          </Text>
        )}
      </Box>

      <Box className="flex flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onPress={onDownload}
          disabled={isDownloading || !form.download_url}
          label={isDownloading ? "Downloading..." : "Download"}
        >
          {isDownloading ? "Downloading..." : "Download"}
        </Button>

        {showSendButton && (
          <Button
            variant="secondary"
            size="sm"
            onPress={onSend}
            disabled
            label="Send to Client (Phase 2)"
          >
            Send to Client
          </Button>
        )}
      </Box>
    </Box>
  );
}
