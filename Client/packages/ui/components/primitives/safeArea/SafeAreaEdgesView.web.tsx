import type { ReactNode } from "react";

export type SafeAreaEdge = "top" | "right" | "bottom" | "left";

export type SafeAreaEdgesViewProps = {
  children?: ReactNode;
  edges?: SafeAreaEdge[];
  className?: string;
};

/** Web: safe-area is a no-op wrapper (browser chrome only). */
export function SafeAreaEdgesView({ children, className }: SafeAreaEdgesViewProps) {
  return <div className={className}>{children}</div>;
}
