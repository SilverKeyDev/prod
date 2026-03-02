import type { ReactNode } from "react";

/**
 * Shared base props for List/FlatList primitive (web and native).
 */
export type ListPropsBase<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  style?: Record<string, unknown>;
};
