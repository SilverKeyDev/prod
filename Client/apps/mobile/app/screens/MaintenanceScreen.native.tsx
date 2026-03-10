import { Platform, StyleSheet, View } from "react-native";

import { Text } from "packages/ui/components/primitives";
import { SHADOW_OFFSET_ELEVATED } from "packages/ui/styles/shadows.native";

export function MaintenanceScreenNative() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>We'll be back soon!</Text>
        <Text style={styles.message}>
          SilverKey is undergoing scheduled maintenance. Please check back in a few minutes.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  card: {
    maxWidth: 400,
    padding: 32,
    backgroundColor: "#f5f5f0",
    borderRadius: 12,

    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 8px rgba(0,0,0,0.08)" }
      : {
          shadowColor: "#000",
          shadowOffset: SHADOW_OFFSET_ELEVATED,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }),
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#A3B18A",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
