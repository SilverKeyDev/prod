import React from "react";

import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

type CalendarConnectionPromptProps = {
  onConnect: () => void;
  isLoading?: boolean;
};

export function CalendarConnectionPrompt({
  onConnect,
  isLoading = false,
}: CalendarConnectionPromptProps) {
  return (
    <Box style={styles.card}>
      <Text style={styles.title}>Connect Your Google Calendar</Text>
      <Text style={styles.body}>
        Sync your Google Calendar to view upcoming events and appointments on your dashboard.
      </Text>
      <Pressable
        onPress={onConnect}
        disabled={isLoading}
        style={[styles.button, isLoading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Connecting…" : "Connect Google Calendar"}
        </Text>
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.200"),
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: color("neutral.900"),
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: color("neutral.600"),
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: color("brand.accent"),
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    color: color("neutral.50"),
  },
});
