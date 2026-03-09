import React from "react";

import { View } from "react-native";

import { Pressable } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

type MessagingClientEmptyStateProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
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
  centeredStyle,
}: MessagingClientEmptyStateProps) {
  return (
    <View style={centeredStyle}>
      <Text className="mb-2 text-center text-base font-medium text-gray-900">{title}</Text>
      <Text className="mb-4 text-center text-sm text-gray-600">{message}</Text>
      <Pressable
        onPress={onAction}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2"
      >
        <Text className="text-sm font-medium text-gray-800">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
