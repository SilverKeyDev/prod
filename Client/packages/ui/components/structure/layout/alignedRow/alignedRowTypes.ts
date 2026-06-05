import type React from "react";

export type AlignedRowItem = {
  title?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
};

export type AlignedRowProps = {
  children?: React.ReactNode;
  items?: AlignedRowItem[];
  className?: string;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  minHeight?: string | number;
  titleClassName?: string;
  contentClassName?: string;
  widths?: number[];
  style?: React.CSSProperties;
  breakIntoRows?: "sm" | "md" | "lg" | "xl" | "never";
};
