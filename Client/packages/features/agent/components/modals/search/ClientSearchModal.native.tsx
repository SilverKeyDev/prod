import React, { useState } from "react";

import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { color } from "packages/design-tokens";
import { useIsAgent } from "packages/features/homeauth";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore, useUIStore } from "packages/store";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Text } from "packages/ui/components/structure/primitives";

import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import { useConnectionRequests } from "@/features/agent/hooks/data/connections/useConnectionRequests";
import { useAgentSearch } from "@/features/agent/hooks/data/discovery/useAgentSearch";
import { useClientSearch } from "@/features/agent/hooks/data/discovery/useAgentSearch";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

type ClientSearchModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ClientSearchModalNative({ isOpen, onClose }: ClientSearchModalNativeProps) {
  const isAgent = useIsAgent();
  const config = getMessagingConfig(isAgent ? "agent" : "client");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { userProfile } = useUserData();
  const authUser = useAuthStore((s) => s.user);
  const initiatorId = userProfile?.id ?? authUser?.id;
  const { clients: clientResults, isLoading: clientsLoading } = useClientSearch(
    searchQuery,
    isOpen && isAgent
  );
  const { agents: agentResults, isLoading: agentsLoading } = useAgentSearch(
    searchQuery,
    isOpen && !isAgent
  );
  const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const isLoading = isAgent ? clientsLoading : agentsLoading;
  const list: Array<{ id: string; name?: string; email?: string }> = isAgent
    ? clientResults
    : agentResults;

  const handleSendRequest = async (otherId: string) => {
    if (!initiatorId) {
      enqueueToast({
        type: "error",
        message: "Profile not loaded. Please try again in a moment.",
      });
      return;
    }
    try {
      const { alreadyPending } = await createRequestAsInitiator(
        initiatorId,
        otherId,
        isAgent,
        message.trim() || undefined
      );
      if (alreadyPending) {
        enqueueToast({
          type: "warning",
          message: "A connection request is already pending with this person.",
        });
        return;
      }
      enqueueToast({ type: "success", message: "Request sent" });
      setMessage("");
      setSelectedId(null);
      onClose();
    } catch (err: unknown) {
      enqueueToast({
        type: "error",
        message: connectionRequestApiErrorMessage(err),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-text-primary text-lg font-semibold">
              {config.searchModal.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary text-base font-medium">Close</Text>
            </Pressable>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={config.searchModal.searchPlaceholder}
              placeholderTextColor={color("neutral.400")}
              style={styles.input}
            />
          </View>
          {searchQuery.length < 2 ? (
            <View style={styles.centered}>
              <Text className="text-text-secondary text-sm">
                Type at least 2 characters to search
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-text-secondary text-sm">
                {config.searchModal.noResultsMessage} "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Pressable
                    onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
                    style={styles.itemPressable}
                  >
                    <Text className="text-text-primary font-medium">{item.name ?? "Unknown"}</Text>
                    <Text className="text-text-secondary text-sm">{item.email ?? ""}</Text>
                  </Pressable>
                  {selectedId === item.id && (
                    <View style={styles.actions}>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Add a note (optional)"
                        placeholderTextColor={color("neutral.400")}
                        style={styles.messageInput}
                        multiline
                      />
                      <View style={styles.buttonRow}>
                        <Pressable
                          onPress={() => handleSendRequest(item.id)}
                          disabled={isCreatingRequest || !initiatorId}
                          style={styles.sendButton}
                        >
                          <Text className="font-semibold text-white">
                            {config.searchModal.sendButtonLabel}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSelectedId(null);
                            setMessage("");
                          }}
                        >
                          <Text className="text-text-secondary font-medium">Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          )}
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
    maxHeight: "85%",
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
  inputRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  input: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: color("neutral.50"),
  },
  list: {
    maxHeight: 360,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  item: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
    overflow: "hidden",
  },
  itemPressable: {
    padding: 12,
  },
  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
    backgroundColor: color("neutral.50"),
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  centered: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
