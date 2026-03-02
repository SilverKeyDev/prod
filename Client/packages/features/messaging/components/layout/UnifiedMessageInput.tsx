import { Send } from "lucide-react";

import Button from "packages/ui/components/button/Button";
import { Textarea } from "packages/ui/components/index.web";

import AttachmentMenu from "@/features/agent/components/AttachmentMenu";
import {
  getMessagingConfig,
  type MessagingMode,
} from "@/features/agent/components/messagingConfig";

type UnifiedMessageInputProps = {
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

export default function UnifiedMessageInput({
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

  return (
    <div className="border-beige flex-shrink-0 border-t bg-white p-4">
      <div className="flex items-center gap-3">
        {/* Attachment button */}
        {(onAttachmentHome ||
          onAttachmentCalendar ||
          onAttachmentDocument ||
          onAttachmentAgreement) && (
          <AttachmentMenu
            onSelectHome={onAttachmentHome || (() => {})}
            onSelectCalendar={onAttachmentCalendar || (() => {})}
            onSelectDocument={onAttachmentDocument}
            onSelectAgreement={onAttachmentAgreement}
            disabled={isTyping || disabled}
          />
        )}
        <div className="flex flex-1">
          <Textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSendMessage();
              }
            }}
            placeholder={finalPlaceholder}
            className="scrollbar-hide border-beige focus:border-brown focus:ring-brown/20 w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 md:py-3 md:text-base"
            disabled={isTyping || disabled}
            rows={1}
          />
        </div>
        <Button
          onClick={onSendMessage}
          disabled={!message.trim() || isTyping || disabled}
          variant={config.input.buttonVariant}
          className="flex-shrink-0 px-4 py-2.5 md:py-3"
        >
          <Send className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>
    </div>
  );
}
