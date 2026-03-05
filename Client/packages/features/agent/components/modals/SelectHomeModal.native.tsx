import React, { useState } from "react";

import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useSavedHomesData } from "packages/features/search";
import type { SavedHome } from "packages/types";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

type SelectHomeModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (home: SavedHome) => void;
};

export default function SelectHomeModalNative({
  isOpen,
  onClose,
  onSelect,
}: SelectHomeModalNativeProps) {
  const { savedHomes, savedHomesLoading } = useSavedHomesData();
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedHomeId) {
      const home = savedHomes.find((h) => h.home_id === selectedHomeId);
      if (home) {
        onSelect(home);
        setSelectedHomeId(null);
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
            <Text className="text-lg font-semibold text-gray-900">Select Home to Share</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-base font-medium text-gray-600">Cancel</Text>
            </Pressable>
          </View>
          {savedHomesLoading ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : savedHomes.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-center text-sm text-gray-500">
                No saved homes found. Save homes to share them in messages.
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedHomes}
              keyExtractor={(item) => item.home_id ?? item.address ?? String(Math.random())}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = selectedHomeId === item.home_id;
                return (
                  <Pressable
                    onPress={() => setSelectedHomeId(item.home_id ?? null)}
                    style={[styles.homeRow, isSelected && styles.homeRowSelected]}
                  >
                    <Box className="flex-1">
                      <Text className="font-medium text-gray-900" numberOfLines={1}>
                        {item.address || `Property ${item.home_id}`}
                      </Text>
                      {item.price != null && (
                        <Text className="mt-1 text-sm text-gray-500">
                          {typeof item.price === "number"
                            ? `$${item.price.toLocaleString()}`
                            : String(item.price)}
                        </Text>
                      )}
                    </Box>
                    {isSelected && <View style={styles.check} />}
                  </Pressable>
                );
              }}
            />
          )}
          {!savedHomesLoading && savedHomes.length > 0 && (
            <View style={styles.footer}>
              <Pressable
                onPress={handleConfirm}
                disabled={!selectedHomeId}
                style={[styles.shareButton, !selectedHomeId && styles.shareButtonDisabled]}
              >
                <Text className="font-semibold text-white">Share Home</Text>
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
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: "#fff",
  },
  homeRowSelected: {
    borderColor: color("brand.accent"),
    backgroundColor: `${color("brand.accent")}18`,
  },
  check: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color("brand.accent"),
    marginLeft: 8,
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
