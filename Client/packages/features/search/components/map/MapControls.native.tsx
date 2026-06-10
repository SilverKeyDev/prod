import React from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { Icon } from "packages/ui/components/structure/primitives";
import { Pressable } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

export type MapControlsNativeProps = {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const PER_PAGE = 1;

export function MapControlsNative({
  page,
  total,
  perPage = PER_PAGE,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
}: MapControlsNativeProps): React.ReactElement {
  const showNavigation = total > perPage;
  const unfocused = page < 0;
  const currentItem = unfocused ? "—" : Math.min(page + perPage, total);
  const isPrevDisabled = page <= 0;
  const isNextDisabled = page + perPage >= total;
  const pageOf = SEARCH_TRANSLATIONS["search.page_of"] ?? "{{current}} of {{total}}";
  const pageLabel = pageOf
    .replace("{{current}}", String(currentItem))
    .replace("{{total}}", String(total));

  return (
    // absoluteFillObject + flex column: spacer pushes controls to the bottom edge of the map
    // container. This is reliable regardless of nested flex/overflow chains.
    <View style={styles.fillOverlay} pointerEvents="box-none">
      {/* Transparent spacer — passes all touches through to the map */}
      <View style={styles.spacer} pointerEvents="none" />

      {/* Controls pinned to the bottom of the map */}
      <View style={styles.controlsRow} pointerEvents="box-none">
        <View style={styles.zoomRow}>
          <Pressable onPress={onZoomOut} style={styles.controlButton}>
            <Icon name="minus" size={18} color={color("neutral.700")} />
          </Pressable>
          <Pressable onPress={onZoomIn} style={styles.controlButton}>
            <Icon name="plus" size={18} color={color("neutral.700")} />
          </Pressable>
        </View>

        {showNavigation && (
          <View style={styles.navRow}>
            <Pressable
              onPress={onPrev}
              disabled={isPrevDisabled}
              style={[styles.controlButton, isPrevDisabled && styles.controlButtonDisabled]}
            >
              <Icon name="chevron-left" size={18} color={color("neutral.700")} />
            </Pressable>
            <View style={styles.pageLabel}>
              <Text className="text-text-secondary text-xs font-medium">{pageLabel}</Text>
            </View>
            <Pressable
              onPress={onNext}
              disabled={isNextDisabled}
              style={[styles.controlButton, isNextDisabled && styles.controlButtonDisabled]}
            >
              <Icon name="chevron-right" size={18} color={color("neutral.700")} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fillOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  spacer: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
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
