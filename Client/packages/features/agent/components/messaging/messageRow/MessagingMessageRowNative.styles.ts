import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";

export const messagingMessageRowNativeStyles = StyleSheet.create({
  dateDividerWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dateDivider: {
    backgroundColor: color("neutral.100"),
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    maxWidth: "85%",
    marginVertical: 4,
  },
  rowEnd: {
    alignSelf: "flex-end",
  },
  rowStart: {
    alignSelf: "flex-start",
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: color("brand.accent"),
  },
  bubbleAgent: {
    backgroundColor: color("neutral.100"),
  },
  bubbleAgreementEmbed: {
    backgroundColor: "transparent",
    padding: 0,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  statusRowEnd: {
    alignSelf: "flex-end",
  },
});
