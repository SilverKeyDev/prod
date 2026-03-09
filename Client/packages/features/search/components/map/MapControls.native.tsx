import React from "react";

import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { color } from "packages/design-tokens";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { Icon } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

export type MapControlsNativeProps = {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  disabled?: boolean;
};

const PER_PAGE = 1;
/** Offset above tab bar + list so controls stay visible over the map. */
const CONTROLS_BOTTOM_OFFSET = 100;

export function MapControlsNative({
  page,
  total,
  perPage = PER_PAGE,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  disabled = false,
}: MapControlsNativeProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + CONTROLS_BOTTOM_OFFSET;

  const showNavigation = total > perPage;
  const currentItem = Math.min((page + 1) * perPage, total);
  const isPrevDisabled = page === 0;
  const isNextDisabled = (page + 1) * perPage >= total;
  const pageOf = SEARCH_TRANSLATIONS["search.page_of"] ?? "{{current}} of {{total}}";
  const pageLabel = pageOf
    .replace("{{current}}", String(currentItem))
    .replace("{{total}}", String(total));

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <View style={styles.zoomRow}>
        <Pressable
          onPress={onZoomOut}
          disabled={disabled}
          style={[styles.controlButton, disabled && styles.controlButtonDisabled]}
        >
          <Text className="text-base font-medium text-gray-700">
            {SEARCH_TRANSLATIONS["search.zoom_out_symbol"] ?? "−"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onZoomIn}
          disabled={disabled}
          style={[styles.controlButton, disabled && styles.controlButtonDisabled]}
        >
          <Text className="text-base font-medium text-gray-700">
            {SEARCH_TRANSLATIONS["search.zoom_in_symbol"] ?? "+"}
          </Text>
        </Pressable>
      </View>
      {showNavigation && (
        <View style={styles.navRow}>
          <Pressable
            onPress={onPrev}
            disabled={isPrevDisabled || disabled}
            style={[
              styles.controlButton,
              (isPrevDisabled || disabled) && styles.controlButtonDisabled,
            ]}
          >
            <Icon name="chevron-left" size={18} color={color("neutral.700")} />
          </Pressable>
          <View style={styles.pageLabel}>
            <Text className="text-xs font-medium text-gray-700">{pageLabel}</Text>
          </View>
          <Pressable
            onPress={onNext}
            disabled={isNextDisabled || disabled}
            style={[
              styles.controlButton,
              (isNextDisabled || disabled) && styles.controlButtonDisabled,
            ]}
          >
            <Icon name="chevron-right" size={18} color={color("neutral.700")} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  zoomRow: {
    flexDirection: "row",
    gap: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: color("neutral.900"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  pageLabel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
    minWidth: 64,
    alignItems: "center",
  },
});
