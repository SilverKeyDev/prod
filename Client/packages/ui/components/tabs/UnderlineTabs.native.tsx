/// <reference types="nativewind/types" />
import React from "react";

import { Pressable, View } from "react-native";

import { Box } from "packages/ui/components/primitives/box";
import { Text } from "packages/ui/components/primitives/text";

export type UnderlineTabItem = {
  id: string;
  label: React.ReactNode;
};

export type UnderlineTabsProps = {
  items: UnderlineTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** When true, uses tighter padding for mobile. */
  compact?: boolean;
  /** Optional class for the container. */
  className?: string;
};

/**
 * Native UnderlineTabs — matches web: horizontal row, border-b gray-200,
 * ghost-style tab buttons, olive underline under active. Same API as UnderlineTabs.web.
 */
export function UnderlineTabs({
  items,
  activeId,
  onChange,
  compact = false,
  className = "",
}: UnderlineTabsProps): JSX.Element {
  const containerClass = compact
    ? "flex flex-row items-center justify-center rounded-none border-b border-gray-200"
    : "flex flex-row flex-shrink-0 rounded-none border-b border-gray-200";
  const tabLayoutClass = compact
    ? "relative flex items-center justify-center px-3 py-2"
    : "relative flex flex-1 items-center justify-center px-4 py-2";
  const textSizeClass = compact ? "text-sm" : "text-sm";

  return (
    <Box
      className={className ? `${containerClass} ${className}` : containerClass}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            className={`${tabLayoutClass} bg-transparent`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {typeof item.label === "string" ? (
              <Text
                className={`${textSizeClass} font-medium text-neutral-600 ${isActive ? "font-semibold" : ""}`}
              >
                {item.label}
              </Text>
            ) : (
              item.label
            )}
            {isActive && (
              <View
                className="bg-olive absolute bottom-0 left-0 right-0 h-0.5 rounded-none"
                pointerEvents="none"
              />
            )}
          </Pressable>
        );
      })}
    </Box>
  );
}
