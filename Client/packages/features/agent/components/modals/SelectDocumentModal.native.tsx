import React from "react";

import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useSingleSelectionModal } from "packages/features/agent/hooks/ui/useSingleSelectionModal";
import { useDocumentsStore } from "packages/store";
import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";
import { Loading } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { mapStoreDocumentsToDocumentData } from "packages/utils/documents";

type SelectDocumentModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (document: DocumentData) => void;
};

export default function SelectDocumentModalNative({
  isOpen,
  onClose,
  onSelect,
}: SelectDocumentModalNativeProps) {
  const documents = useDocumentsStore((s) => s.documents);
  const documentsLoading = useDocumentsStore((s) => s.documentsLoading);
  const mappedDocuments = mapStoreDocumentsToDocumentData(documents);
  const {
    selectedId,
    setSelectedId,
    handleConfirm,
    isLoading: documentsLoadingFromHook,
  } = useSingleSelectionModal<DocumentData>(mappedDocuments, (d) => d.id, {
    isLoading: documentsLoading,
  });

  const onConfirm = () => handleConfirm(onSelect, { onClose, closeOnConfirm: true });

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-text-primary text-lg font-semibold">
              Select Document to Share
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary text-base font-medium">Cancel</Text>
            </Pressable>
          </View>
          {documentsLoadingFromHook ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : mappedDocuments.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-text-secondary text-center text-sm">
                No documents found. Upload documents to share them in messages.
              </Text>
            </View>
          ) : (
            <FlatList
              data={mappedDocuments}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = selectedId === item.id;
                return (
                  <Pressable
                    onPress={() => setSelectedId(isSelected ? null : item.id)}
                    style={[styles.docRow, isSelected && styles.docRowSelected]}
                  >
                    <Text className="text-text-primary font-medium" numberOfLines={1}>
                      {item.filename}
                    </Text>
                    <Text className="text-text-secondary text-sm">{item.status}</Text>
                  </Pressable>
                );
              }}
            />
          )}
          {!documentsLoading && mappedDocuments.length > 0 && (
            <View style={styles.footer}>
              <Pressable
                onPress={onConfirm}
                disabled={!selectedId}
                style={[styles.shareButton, !selectedId && styles.shareButtonDisabled]}
              >
                <Text className="font-semibold text-white">Share Document</Text>
              </Pressable>
            </View>
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
    maxHeight: "80%",
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
  list: {
    maxHeight: 320,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  docRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
  },
  docRowSelected: {
    borderColor: color("brand.accent"),
    backgroundColor: `${color("brand.accent")}18`,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color("neutral.200"),
  },
  shareButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  centered: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
