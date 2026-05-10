import { StyleSheet } from "react-native";

import { Z_LAYERS } from "packages/design-tokens";

export const searchPageMapContainerNativeStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  map: {
    flex: 1,
    width: "100%",
    borderRadius: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: Z_LAYERS.dropdown,
    borderRadius: 16,
  },
});
