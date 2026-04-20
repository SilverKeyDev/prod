/// <reference types="nativewind/types" />
import React from "react";

import { Icon } from "@ui/icons";
import { Pressable, View } from "react-native";

import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import { UNDERLINE_TAB_SIZE_STYLES, type UnderlineTabsSize } from "./underlineTabSizeStyles";

export type UnderlineTabItem = {
  id: string;
  label: React.ReactNode;
  /** Optional icon shown before the label. */
  icon?: React.ReactNode;
  /** When true, tab shows lock icon and muted styling (view-only, still clickable). */
  locked?: boolean;
};

export type UnderlineTabsProps = {
  items: UnderlineTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** When true, uses tighter padding for mobile. */
  compact?: boolean;
  /** Tab label scale; default matches previous sizing. */
  size?: UnderlineTabsSize;
  /** Optional class for the container. */
  className?: string;
  /** Underline color class (default: bg-gold, matching search Results/Saved). */
  underlineColor?: string;
};

/**
 * Native UnderlineTabs - matches web: horizontal row, border-b, ghost-style tab buttons,
 * gold underline under active. Same API and look as web UnderlineTabs (search Results/Saved).
 */
export function UnderlineTabs({
  items,
  activeId,
  onChange,
  compact = false,
  size: tabSize = "sm",
  className = "",
  underlineColor = "bg-gold",
}: UnderlineTabsProps): JSX.Element {
  const sizeStyles = UNDERLINE_TAB_SIZE_STYLES[tabSize];
  const containerClass = compact
    ? "flex flex-row items-center justify-center rounded-none border-b border-border"
    : "flex flex-row flex-shrink-0 rounded-none border-b border-border";
  const tabLayoutClass = `${compact ? sizeStyles.paddingCompact : sizeStyles.paddingDefault} gap-2`;

  return (
    <Box className={className ? `${containerClass} ${className}` : containerClass}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const isLocked = item.locked === true;
        const textSizeClass = isActive ? sizeStyles.activeText : sizeStyles.inactiveText;
        const iconSizeClass = isActive ? sizeStyles.activeIcon : sizeStyles.inactiveIcon;
        const fontWeightClass = isActive ? "font-bold" : "font-medium";
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            className={`${tabLayoutClass} bg-transparent`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isLocked ? (
              <Icon name="lock" className={`${iconSizeClass} shrink-0`} />
            ) : (
              item.icon != null && <Box className={`${iconSizeClass} shrink-0`}>{item.icon}</Box>
            )}
            {typeof item.label === "string" ? (
              <Text
                className={`${textSizeClass} ${fontWeightClass} ${
                  isLocked ? "text-neutral-400 opacity-75" : "text-neutral-600"
                }`}
              >
                {item.label}
              </Text>
            ) : (
              item.label
            )}
            {isActive && (
              <View
                className={`${underlineColor} absolute bottom-0 left-2 right-2 h-0.5 rounded-none`}
                pointerEvents="none"
              />
            )}
          </Pressable>
        );
      })}
    </Box>
  );
}
