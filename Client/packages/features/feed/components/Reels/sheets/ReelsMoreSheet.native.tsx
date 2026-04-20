import { useCallback } from "react";

import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

import type { FeedListing } from "@/features/feed/types/feed";

export type ReelsMoreActionId = "not-interested" | "report" | "copy-link" | "save";

type ReelsMoreSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing | null;
  isSaved?: boolean;
  onNotInterested?: () => void;
  onReport?: () => void;
  onCopyLink?: () => void;
  onSave?: () => void;
};

export function ReelsMoreSheet({
  isOpen,
  onClose,
  item: _item,
  isSaved = false,
  onNotInterested,
  onReport,
  onCopyLink,
  onSave,
}: ReelsMoreSheetProps) {
  const { height } = useWindowDimensions();
  const panelHeight = Math.max(240, Math.floor(height * 0.5));

  const closeThen = useCallback(
    (fn?: () => void) => {
      fn?.();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.panel, { height: panelHeight }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerSpacer} />
              <Text className="text-text-primary text-base font-semibold">More</Text>
              <View style={styles.headerSpacerRight}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  icon={<Icon name="x" size={20} color={color("neutral.700")} />}
                  label="Close more options"
                  onPress={onClose}
                />
              </View>
            </View>
          </View>

          <View style={styles.body}>
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              onPress={() => closeThen(onNotInterested)}
            >
              <View style={styles.row}>
                <Icon name="x-circle" size={20} color={color("neutral.700")} />
                <Text className="text-text-primary text-sm">Not interested</Text>
              </View>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              onPress={() => closeThen(onReport)}
            >
              <View style={styles.row}>
                <Icon name="flag" size={20} color={color("neutral.700")} />
                <Text className="text-text-primary text-sm">Report</Text>
              </View>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              onPress={() => closeThen(onCopyLink)}
              iconName="copy"
              contentAlign="start"
            >
              <View style={styles.row}>
                <Text className="text-text-primary text-sm">Copy link</Text>
              </View>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="justify-start"
              onPress={() => closeThen(onSave)}
              iconName="bookmark"
              contentAlign="start"
            >
              <View style={styles.row}>
                <Text className="text-text-primary text-sm">{isSaved ? "Unsave" : "Save"}</Text>
              </View>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  panel: {
    width: "100%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: color("neutral.50"),
    overflow: "hidden",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: color("neutral.200"),
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: color("neutral.300"),
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerSpacer: {
    width: 36,
  },
  headerSpacerRight: {
    width: 36,
    alignItems: "flex-end",
  },
  body: {
    paddingVertical: 8,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
