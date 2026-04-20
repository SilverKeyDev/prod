import React, { useEffect } from "react";

import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useMultiSelectionModal } from "packages/features/agent/hooks/ui/useMultiSelectionModal";
import { useSavedHomesData } from "packages/features/search";
import type { SavedHome } from "packages/types";
import { Loading } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

type SelectHomeModalNativeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (homes: SavedHome[]) => void | Promise<void>;
};

export default function SelectHomeModalNative({
  isOpen,
  onClose,
  onSelect,
}: SelectHomeModalNativeProps) {
  const { t } = useLocalization();
  const { savedHomes, savedHomesLoading } = useSavedHomesData();
  const {
    selectedIds,
    toggleId,
    clearSelection,
    selectedItems,
    handleConfirm,
    isLoading: savedHomesLoadingFromHook,
    maxItems,
  } = useMultiSelectionModal<SavedHome>(savedHomes, (h) => h.home_id ?? "", {
    isLoading: savedHomesLoading,
  });

  useEffect(() => {
    if (!isOpen) clearSelection();
  }, [isOpen, clearSelection]);

  const onConfirm = () => void handleConfirm(onSelect, { onClose, closeOnConfirm: true });

  const shareLabel =
    selectedItems.length <= 1
      ? t("agent.share_homes_confirm_one")
      : t("agent.share_homes_confirm_many", { count: selectedItems.length });

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text className="text-text-primary flex-1 pr-2 text-lg font-semibold">
              {t("agent.select_homes_to_share_title")}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text className="text-text-secondary text-base font-medium">
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
          <Text className="text-text-secondary px-4 pb-2 text-xs">
            {t("agent.select_homes_to_share_hint", { max: maxItems })}
          </Text>
          {savedHomesLoadingFromHook ? (
            <View style={styles.centered}>
              <Loading />
            </View>
          ) : savedHomes.length === 0 ? (
            <View style={styles.centered}>
              <Text className="text-text-secondary text-center text-sm">
                {t("agent.no_saved_homes_to_share")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedHomes}
              keyExtractor={(item, index) => item.home_id || item.address || `row-${index}`}
              style={styles.list}
              renderItem={({ item }) => {
                const id = item.home_id ?? "";
                const isSelected = id ? selectedIds.has(id) : false;
                return (
                  <Pressable
                    onPress={() => toggleId(item.home_id)}
                    style={[styles.homeRow, isSelected && styles.homeRowSelected]}
                  >
                    <Box className="flex-1">
                      <Text className="text-text-primary font-medium" numberOfLines={1}>
                        {item.address || `Property ${item.home_id}`}
                      </Text>
                      {item.price != null && (
                        <Text className="text-text-secondary mt-1 text-sm">
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
                onPress={onConfirm}
                disabled={selectedItems.length === 0}
                style={[
                  styles.shareButton,
                  selectedItems.length === 0 && styles.shareButtonDisabled,
                ]}
              >
                <Text className="font-semibold text-white">{shareLabel}</Text>
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
    backgroundColor: color("neutral.50"),
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
