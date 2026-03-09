import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";

import { Textarea } from "@/components/ui";
type ClientMessageInputProps = {
  message: string;
  setMessage: (message: string) => void;
  isTyping: boolean;
  onSendMessage: () => void;
};
export default function ClientMessageInput({
  message,
  setMessage,
  isTyping,
  onSendMessage,
}: ClientMessageInputProps) {
  return (
    <div className="border-beige flex-shrink-0 border-t bg-white p-4">
      <div className="flex items-center gap-3">
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
            placeholder="Ask about this property!"
            className="scrollbar-hide border-beige focus:border-brown focus:ring-brown/20 w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 md:py-3 md:text-base"
            disabled={isTyping}
            rows={1}
          />
        </div>
        <Button
          onClick={onSendMessage}
          disabled={!message.trim() || isTyping}
          variant="primary"
          className="flex-shrink-0 px-4 py-2.5 md:py-3"
        >
          <Icon name="send" className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
      </div>
    </div>
  );
}
