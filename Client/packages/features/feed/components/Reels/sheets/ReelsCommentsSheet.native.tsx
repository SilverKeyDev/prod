import { useCallback, useMemo, useState } from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/structure/primitives";

import type { FeedComment, FeedListing } from "@/features/feed/types/feed";

type ReelsCommentsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  item: FeedListing | null;
  comments: FeedComment[];
  onAddComment?: (text: string) => void;
  currentUser?: {
    name: string;
    avatarUrl?: string;
  };
};

export function ReelsCommentsSheet({
  isOpen,
  onClose,
  item,
  comments,
  onAddComment,
}: ReelsCommentsSheetProps) {
  const { height } = useWindowDimensions();
  const panelHeight = Math.max(240, Math.floor(height * 0.75));

  const [draft, setDraft] = useState("");
  const canPost = draft.trim().length > 0;

  const handlePost = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    onAddComment?.(text);
    setDraft("");
  }, [draft, onAddComment]);

  const data = useMemo(() => comments, [comments]);

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
              <Text className="text-text-primary text-base font-semibold">Comments</Text>
              <View style={styles.headerSpacerRight}>
                <IconButton
                  variant="ghost"
                  size="sm"
                  rounded="full"
                  icon={<Icon name="x" size={20} color={color("neutral.700")} />}
                  label="Close comments"
                  onPress={onClose}
                />
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {data.length === 0 ? (
              <View style={styles.empty}>
                <Text className="text-text-secondary text-sm">No comments yet.</Text>
                <Text className="text-text-secondary text-sm">Be the first to comment.</Text>
              </View>
            ) : (
              <FlatList
                data={data}
                keyExtractor={(c) => c.id}
                renderItem={({ item: c }) => (
                  <View style={styles.commentRow}>
                    <View style={styles.commentBody}>
                      <Text className="text-text-primary text-sm">
                        <Text className="text-text-primary text-sm font-semibold">
                          {c.user.name}
                        </Text>{" "}
                        <Text className="text-text-primary text-sm">{c.text}</Text>
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>

          {item && (
            <View style={styles.footer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Add a comment (optional)"
                placeholderTextColor={color("neutral.500")}
                style={styles.input}
              />
              <IconButton
                variant="ghost"
                size="md"
                rounded="full"
                icon={
                  <Icon
                    name="send"
                    size={20}
                    color={canPost ? color("brand.accent") : color("neutral.400")}
                  />
                }
                label="Post comment"
                disabled={!canPost}
                onPress={handlePost}
              />
            </View>
          )}
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
    flex: 1,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 4,
  },
  commentRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  commentBody: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: color("neutral.200"),
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: color("neutral.900"),
  },
});
