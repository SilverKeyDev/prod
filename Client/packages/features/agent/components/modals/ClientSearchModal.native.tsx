import React, { useState } from "react";

import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";

import { color } from "packages/design-tokens";
import { useUserData } from "packages/hooks/data/auth/useUserData";
import { useAuthStore } from "packages/store";
import { useUIStore } from "packages/store";
import { Loading } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives/text";

import { useAgentSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useClientSearch } from "@/features/agent/hooks/data/useAgentSearch";
import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";

type ClientSearchModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ClientSearchModalNative({ isOpen, onClose }: ClientSearchModalNativeProps) {
  const isAgent = useAuthStore((s) => !!s.user?.is_agent);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { userProfile } = useUserData();
  const { clients: clientResults, isLoading: clientsLoading } = useClientSearch(
    searchQuery,
    isOpen && isAgent
  );
  const { agents: agentResults, isLoading: agentsLoading } = useAgentSearch(
    searchQuery,
    isOpen && !isAgent
  );
  const { createRequest, isCreatingRequest } = useConnectionRequests();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const isLoading = isAgent ? clientsLoading : agentsLoading;
  const list: Array<{ id: string; name?: string; email?: string }> = isAgent
    ? clientResults
    : agentResults;
  const title = isAgent ? "Search for a Client" : "Search for an Agent";

  const handleSendRequest = async (otherId: string) => {
    if (!userProfile?.id) return;
    try {
      if (isAgent) {
        await createRequest(userProfile.id, otherId, message.trim() || undefined);
      } else {
        await createRequest(otherId, userProfile.id, message.trim() || undefined);
      }
      enqueueToast({ type: "success", message: "Connection request sent" });
      setMessage("");
      setSelectedId(null);
      onClose();
    } catch {
      enqueueToast({ type: "error", message: "Failed to send connection request" });
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-base font-medium text-gray-600">Close</Text>
            </Pressable>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email..."
              placeholderTextColor={color("neutral.400")}
              style={styles.input}
            />
          </View>
          {searchQuery.length < 2 ? (
            <View style={styles.centered}>
              <Text className="text-sm text-gray-500">Type at least 2 characters to search</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-sm text-gray-500">No results found</Text>
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
                    <Text className="font-medium text-gray-900">{item.name ?? "Unknown"}</Text>
                    <Text className="text-sm text-gray-600">{item.email ?? ""}</Text>
                  </Pressable>
                  {selectedId === item.id && (
                    <View style={styles.actions}>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Add a message (optional)"
                        placeholderTextColor={color("neutral.400")}
                        style={styles.messageInput}
                        multiline
                      />
                      <View style={styles.buttonRow}>
                        <Pressable
                          onPress={() => handleSendRequest(item.id)}
                          disabled={isCreatingRequest}
                          style={styles.sendButton}
                        >
                          <Text className="font-semibold text-white">Send Request</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setSelectedId(null);
                            setMessage("");
                          }}
                        >
                          <Text className="font-medium text-gray-600">Cancel</Text>
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
