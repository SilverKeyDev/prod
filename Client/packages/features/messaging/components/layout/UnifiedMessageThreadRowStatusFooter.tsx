import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";

type MessageStyleConfig = MessagingConfig["messageStyles"]["agent"];

export type UnifiedMessageThreadRowStatusFooterProps = {
  msg: ChatMessage;
  isCurrentUserMessage: boolean;
  shouldShowDelivered: boolean;
  messageConfig: MessageStyleConfig;
  t: (key: string) => string;
  onRetryMessage?: (messageId: string) => void;
};

export function UnifiedMessageThreadRowStatusFooter({
  msg,
  isCurrentUserMessage,
  shouldShowDelivered,
  messageConfig,
  t,
  onRetryMessage,
}: UnifiedMessageThreadRowStatusFooterProps) {
  if (!isCurrentUserMessage || !msg.status) {
    return null;
  }

  return (
    <Box
      className={`mt-1 flex w-full gap-1.5 ${
        messageConfig.justify === "end" ? "justify-end" : "justify-start"
      }`}
    >
      {msg.status === "failed" && onRetryMessage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRetryMessage(msg.id)}
          className="text-destructive hover:text-destructive-hover text-xs font-medium underline"
          label={t("agent.retry_sending_message")}
          iconName="send"
        >
          {t("agent.retry")}
        </Button>
      )}
      <BodyText
        as="span"
        size="xs"
        className={`font-medium ${
          msg.status === "failed" ? "text-destructive" : "text-text-secondary"
        }`}
      >
        {msg.status === "sending"
          ? t("agent.sending")
          : shouldShowDelivered
            ? t("agent.delivered")
            : msg.status === "delivered"
              ? ""
              : t("agent.failed_to_send")}
      </BodyText>
    </Box>
  );
}
