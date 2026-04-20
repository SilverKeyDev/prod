import React from "react";

import Input from "@ui/form/Input";
import { View } from "react-native";

import { useLocalization } from "packages/contexts";
import { Pressable, Text } from "packages/ui/components/primitives";

import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";

type MessagingScreenNativeComposerProps = {
  inputText: string;
  onInputTextChange: (value: string) => void;
  canSendMessage: boolean;
  config: MessagingConfig;
  onSend: () => void;
  onOpenAttachmentMenu: () => void;
  inputRowStyle: object;
};

export function MessagingScreenNativeComposer({
  inputText,
  onInputTextChange,
  canSendMessage,
  config,
  onSend,
  onOpenAttachmentMenu,
  inputRowStyle,
}: MessagingScreenNativeComposerProps) {
  const { t } = useLocalization();

  return (
    <View style={inputRowStyle}>
      <Pressable
        onPress={onOpenAttachmentMenu}
        disabled={!canSendMessage}
        className="border-border bg-background-surface mr-2 rounded-lg border p-3"
      >
        <Text className="text-text-secondary text-sm font-medium">+</Text>
      </Pressable>
      <Input
        value={inputText}
        onValueChange={onInputTextChange}
        placeholder={config.input.placeholder}
        className="border-border bg-background-surface flex-1 rounded-lg border px-4 py-3"
        editable={canSendMessage}
      />
      <Pressable
        onPress={onSend}
        disabled={!inputText.trim() || !canSendMessage}
        className="bg-primary ml-2 rounded-lg px-4 py-3"
      >
        <Text className="font-medium text-white">{t("agent.send")}</Text>
      </Pressable>
    </View>
  );
}
