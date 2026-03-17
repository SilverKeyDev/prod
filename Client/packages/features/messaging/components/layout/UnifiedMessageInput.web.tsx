import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

import { AutoExpandingTextarea } from "@/components/ui";
import AttachmentMenu from "@/features/agent/components/AttachmentMenu";
import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messagingConfig";

export type UnifiedMessageInputProps = {
  mode: MessagingMode;
  message: string;
  setMessage: (message: string) => void;
  isTyping: boolean;
  onSendMessage: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedClientName?: string;
  onAttachmentHome?: () => void;
  onAttachmentCalendar?: () => void;
  onAttachmentDocument?: () => void;
  onAttachmentAgreement?: () => void;
};

export default function UnifiedMessageInputWeb({
  mode,
  message,
  setMessage,
  isTyping,
  onSendMessage,
  disabled = false,
  placeholder,
  selectedClientName,
  onAttachmentHome,
  onAttachmentCalendar,
  onAttachmentDocument,
  onAttachmentAgreement,
}: UnifiedMessageInputProps) {
  const config = getMessagingConfig(mode);
  const finalPlaceholder =
    placeholder ||
    (mode === "agent" && selectedClientName
      ? `Message ${selectedClientName}...`
      : config.input.placeholder);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Web-specific keyboard shortcuts
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: Add new line (default behavior)
        return;
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd+Enter (Mac) or Ctrl+Enter (Windows): Send message
        e.preventDefault();
        void onSendMessage();
      } else {
        // Plain Enter: Send message (default behavior)
        e.preventDefault();
        void onSendMessage();
      }
    }
  };

  const hasAttachments = Boolean(
    onAttachmentHome || onAttachmentCalendar || onAttachmentDocument || onAttachmentAgreement
  );

  return (
    <Box className="border-border bg-background-base flex-shrink-0 border-t p-3 sm:p-4">
      <Box className="flex items-end gap-2 sm:gap-3">
        {/* Attachment button */}
        {hasAttachments && (
          <AttachmentMenu
            onSelectHome={onAttachmentHome || (() => {})}
            onSelectCalendar={onAttachmentCalendar || (() => {})}
            onSelectDocument={onAttachmentDocument}
            onSelectAgreement={onAttachmentAgreement}
            disabled={isTyping || disabled}
          />
        )}

        {/* Text input container */}
        <Box className="flex flex-1">
          <AutoExpandingTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={finalPlaceholder}
            disabled={isTyping || disabled}
            minHeight={44}
            maxHeight={120}
            className="focus:border-primary focus:ring-accent-muted border-border bg-background-surface rounded-lg text-sm transition-colors duration-150 focus:outline-none focus:ring-2 sm:text-base"
          />
        </Box>

        {/* Send button */}
        <Button
          onClick={onSendMessage}
          disabled={!message.trim() || isTyping || disabled}
          variant={config.input.buttonVariant}
          className="disabled:bg-disabled disabled:text-text-disabled h-11 flex-shrink-0 px-4 transition-all duration-150 ease-out hover:shadow-md active:scale-95 disabled:scale-95"
        >
          <Icon name="send" className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </Box>
    </Box>
  );
}
