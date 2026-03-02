/**
 * Provides the native link primitive (Pressable + Text) for packages/navigation Link
 */

import React from "react";

import { Pressable, Text } from "react-native";

import { LinkPrimitiveContext } from "packages/navigation";

function NativeLinkPrimitive({
  onPress,
  children,
  ...rest
}: {
  onPress?: () => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Pressable onPress={onPress} {...rest}>
      <Text>{children ?? ""}</Text>
    </Pressable>
  );
}

type NavigationLinkPrimitiveProviderProps = {
  children: React.ReactNode;
};

export function NavigationLinkPrimitiveProvider({
  children,
}: NavigationLinkPrimitiveProviderProps) {
  return (
    <LinkPrimitiveContext.Provider value={NativeLinkPrimitive}>
      {children}
    </LinkPrimitiveContext.Provider>
  );
}
