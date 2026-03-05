import React, { useState } from "react";

import { Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { color } from "packages/design-tokens";
import { buildEventRequestMessage } from "packages/features/messaging/utils/eventRequestPayload"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Shared event request builder; utils live in messaging. */
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { useAuthStore } from "packages/store";
import { Text } from "packages/ui/components/primitives/text";
import { dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";

type CalendarEventRequestModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CalendarEventRequestModalNative({
  isOpen,
  onClose,
  onSuccess,
}: CalendarEventRequestModalNativeProps) {
  const isAgent = useAuthStore((s) => !!s.user?.is_agent);
  const { clients } = useAgentClients();
  const { conversations, sendMessage } = useAgentChats();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [isSending, setIsSending] = useState(false);

  const clientConversation = !isAgent && conversations.length > 0 ? conversations[0] : null;

  const getConversationId = (clientId: string): string | null => {
    const conv = conversations.find((c) => c.client_id === clientId);
    return conv?.id ?? null;
  };

  const handleSend = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) return;
    let conversationId: string | null = null;
    if (isAgent) {
      if (!selectedClientId) return;
      conversationId = getConversationId(selectedClientId) ?? "new";
    } else {
      if (!clientConversation) return;
      conversationId = clientConversation.id;
    }
    const dateTime = dateParseISO(`${eventDate}T${eventTime}`);
    const endTime = dateTime.add(30, "minute");
    const payload = {
      title: eventTitle.trim(),
      start: dateTime.toISOString(),
      end: endTime.toISOString(),
      description: eventDescription.trim() || undefined,
    };
    const message = buildEventRequestMessage(payload);
    setIsSending(true);
    try {
      const clientIdToPass = isAgent && conversationId === "new" ? selectedClientId : undefined;
      await sendMessage(conversationId, message, clientIdToPass ?? undefined);
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      setSelectedClientId(null);
      onSuccess?.();
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const canSend =
    eventTitle.trim() &&
    eventDate &&
    eventTime &&
    (isAgent ? selectedClientId !== null : clientConversation !== null);

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-lg font-semibold text-gray-900">Request Calendar Event</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-base font-medium text-gray-600">Cancel</Text>
            </Pressable>
          </View>
          <View style={styles.form}>
            <Text className="mb-1 text-sm font-medium text-gray-700">Title</Text>
            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Event title"
              placeholderTextColor={color("neutral.400")}
              style={styles.input}
            />
            <Text className="mb-1 mt-3 text-sm font-medium text-gray-700">Date (YYYY-MM-DD)</Text>
            <TextInput
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="2025-03-15"
              placeholderTextColor={color("neutral.400")}
              style={styles.input}
            />
            <Text className="mb-1 mt-3 text-sm font-medium text-gray-700">Time</Text>
            <TextInput
              value={eventTime}
              onChangeText={setEventTime}
              placeholder="14:00"
              placeholderTextColor={color("neutral.400")}
              style={styles.input}
            />
            <Text className="mb-1 mt-3 text-sm font-medium text-gray-700">
              Description (optional)
            </Text>
            <TextInput
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="Description"
              placeholderTextColor={color("neutral.400")}
              style={[styles.input, styles.textArea]}
              multiline
            />
            {isAgent && clients.length > 0 && (
              <>
                <Text className="mb-1 mt-3 text-sm font-medium text-gray-700">Client</Text>
                <View style={styles.clientList}>
                  {clients.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedClientId(selectedClientId === c.id ? null : c.id)}
                      style={[
                        styles.clientChip,
                        selectedClientId === c.id && styles.clientChipSelected,
                      ]}
                    >
                      <Text
                        className={
                          selectedClientId === c.id ? "font-medium text-white" : "text-gray-700"
                        }
                      >
                        {c.name ?? c.email ?? c.id}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <Pressable
              onPress={handleSend}
              disabled={!canSend || isSending}
              style={[styles.sendButton, (!canSend || isSending) && styles.sendButtonDisabled]}
            >
              <Text className="font-semibold text-white">
                {isSending ? "Sending..." : "Send event request"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: color("neutral.50"),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
  },
  clientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  clientChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: "#fff",
  },
  clientChipSelected: {
    backgroundColor: color("brand.accent"),
    borderColor: color("brand.accent"),
  },
  sendButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
