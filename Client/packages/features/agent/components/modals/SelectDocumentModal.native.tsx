import React, { useState } from "react";

import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useDocumentsStore } from "packages/store";
import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";
import { Loading } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mappedDocuments: DocumentData[] = documents.map((d) => ({
    id: d.id,
    filename: d.name,
    file_path: d.file_path,
    status: d.status,
    created_at: d.uploaded_at ? d.uploaded_at.toISOString() : null,
    updated_at: null,
    user_id: d.uploaded_by,
    document_type: d.document_type ?? null,
    address: d.address ?? null,
  }));

  const handleConfirm = () => {
    if (selectedId) {
      const doc = mappedDocuments.find((d) => d.id === selectedId);
      if (doc) {
        onSelect(doc);
        setSelectedId(null);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-lg font-semibold text-gray-900">Select Document to Share</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-base font-medium text-gray-600">Cancel</Text>
            </Pressable>
          </View>
          {documentsLoading ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : mappedDocuments.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-center text-sm text-gray-500">
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
                    <Text className="font-medium text-gray-900" numberOfLines={1}>
                      {item.filename}
                    </Text>
                    <Text className="text-sm text-gray-500">{item.status}</Text>
                  </Pressable>
                );
              }}
            />
          )}
          {!documentsLoading && mappedDocuments.length > 0 && (
            <View style={styles.footer}>
              <Pressable
                onPress={handleConfirm}
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
