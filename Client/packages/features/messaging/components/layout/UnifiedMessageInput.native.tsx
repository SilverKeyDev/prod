import React from "react";

import { Icon } from "@ui/icons";
import { BodyText } from "@ui/text";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
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
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16, // Prevent iOS zoom
    lineHeight: 20,
    textAlignVertical: "top", // Android
  },
  textInputFocused: {
    borderColor: "#A3B18A",
    shadowColor: "#A3B18A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#A3B18A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
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
  onAttachmentAgreement,
}: UnifiedMessageInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const config = getMessagingConfig(mode);
  const finalPlaceholder =
    placeholder ||
    (mode === "agent" && selectedClientName
      ? `Message ${selectedClientName}...`
      : config.input.placeholder);

  const hasAttachments = Boolean(
    onAttachmentHome || onAttachmentCalendar || onAttachmentDocument || onAttachmentAgreement
  );

  const canSend = message.trim() && !isTyping && !disabled;

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
              onSelectAgreement={onAttachmentAgreement}
              disabled={isTyping || disabled}
            />
          )}

          {/* Text input container */}
          <View style={styles.textInputContainer}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={finalPlaceholder}
              placeholderTextColor="#9CA3AF"
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
            <Icon name="send" size={20} color={canSend ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
