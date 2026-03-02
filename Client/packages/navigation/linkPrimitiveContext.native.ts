/**
 * Native: context for the link primitive (Pressable/View). Provided by the app
 * so packages/navigation does not import react-native.
 */

import { createContext } from "react";

import type { ReactNode } from "react";

export type LinkPrimitiveProps = {
  onPress: () => void;
  children: ReactNode;
  [key: string]: unknown;
};

export type LinkPrimitive = (props: LinkPrimitiveProps) => ReactNode;

export const LinkPrimitiveContext = createContext<LinkPrimitive | null>(null);
