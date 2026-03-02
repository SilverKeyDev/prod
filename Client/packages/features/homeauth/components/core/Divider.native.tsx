import React from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives/text";

interface DividerProps {
  text?: string;
}

export default function AuthDivider({ text = "Or continue with" }: DividerProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      <View style={styles.line} />
      <Text style={styles.label}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: color("neutral.300"),
  },
  label: {
    fontSize: 14,
    color: color("neutral.500"),
  },
});
