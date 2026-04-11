import React from "react";

import { Icon } from "@ui/icons";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { color } from "packages/design-tokens";

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
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  textInputContainer: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    backgroundColor: color("background-surface"),
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16, // Prevent iOS zoom
    lineHeight: 20,
    textAlignVertical: "top", // Android
  },
  textInputFocused: {
    borderColor: color("olive.DEFAULT"),
    shadowColor: color("olive.DEFAULT"),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color("olive.DEFAULT"),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color("neutral.900"),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: color("neutral.300"),
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default function UnifiedMessageInputNative({
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
}: UnifiedMessageInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const config = getMessagingConfig(mode);
  const finalPlaceholder =
    placeholder ||
    (mode === "agent" && selectedClientName
      ? `Message ${selectedClientName}...`
      : config.input.placeholder);

  const hasAttachments = Boolean(
    onAttachmentHome || onAttachmentCalendar || onAttachmentDocument,
  );

  const canSend = message.trim() && !isTyping && !disabled;

  /* eslint-disable silverkey/no-platform-feature-check -- KeyboardAvoidingView API requires platform-specific behavior, not feature gating */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputRow}>
          {/* Attachment button */}
          {hasAttachments && (
            <AttachmentMenu
              onSelectHome={onAttachmentHome || (() => {})}
              onSelectCalendar={onAttachmentCalendar || (() => {})}
              onSelectDocument={onAttachmentDocument}
              disabled={isTyping || disabled}
            />
          )}

          {/* Text input container */}
          <View style={styles.textInputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={finalPlaceholder}
              placeholderTextColor={color("neutral.400")}
              multiline
              blurOnSubmit={false}
              editable={!isTyping && !disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={[styles.textInput, isFocused && styles.textInputFocused]}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (canSend) {
                  onSendMessage();
                }
              }}
              enablesReturnKeyAutomatically
            />
          </View>

          {/* Send button */}
          <TouchableOpacity
            onPress={onSendMessage}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            activeOpacity={0.7}
          >
            <Icon
              name="send"
              size={20}
              color={
                canSend ? color("background-surface") : color("neutral.400")
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
