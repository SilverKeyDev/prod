import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";

export const messagingScreenNativeStyles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: color("border"),
    backgroundColor: color("background-base"),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
