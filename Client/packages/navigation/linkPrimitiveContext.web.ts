/**
 * Web: same context type for resolution; Link.web uses react-router-dom and does not use this.
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
