import { Send } from "lucide-react";
import Button from "../../../components/ui/button/Button";
import { getMessagingConfig, type MessagingMode } from "../config/messagingConfig";

type UnifiedMessageInputProps = {
  mode: MessagingMode;
  message: string;
  setMessage: (message: string) => void;
  isTyping: boolean;
  onSendMessage: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedClientName?: string;
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
}: UnifiedMessageInputProps) {
  const config = getMessagingConfig(mode);
  const finalPlaceholder =
    placeholder ||
    (mode === "agent" && selectedClientName
      ? `Message ${selectedClientName}...`
      : config.input.placeholder);

  return (
    <div className="flex-shrink-0 border-t border-beige bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1">
          <textarea
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSendMessage();
              }
            }}
            placeholder={finalPlaceholder}
            className="scrollbar-hide w-full resize-none rounded-lg border border-beige px-3 py-2.5 text-sm transition-colors duration-150 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/20 md:py-3 md:text-base"
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

