import React from "react";

import { View } from "react-native";

import { Pressable } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

type MessagingClientEmptyStateProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  centeredStyle: {
    flex: number;
    justifyContent: "center";
    alignItems: "center";
    padding: number;
  };
};

export function MessagingClientEmptyState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  centeredStyle,
}: MessagingClientEmptyStateProps) {
  return (
    <View style={centeredStyle}>
      <Text className="text-text-primary mb-2 text-center text-base font-medium">{title}</Text>
      <Text className="text-text-secondary mb-4 text-center text-sm">{message}</Text>
      {onSecondaryAction && secondaryActionLabel ? (
        <Pressable onPress={onSecondaryAction} className="bg-primary mb-2 rounded-lg px-4 py-2">
          <Text className="text-center text-sm font-medium text-white">{secondaryActionLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onAction}
        className="border-border bg-background-surface rounded-lg border px-4 py-2"
      >
        <Text className="text-text-primary text-sm font-medium">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
