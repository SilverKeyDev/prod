import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SafeAreaEdge = "top" | "right" | "bottom" | "left";

export type SafeAreaEdgesViewProps = ViewProps & {
  children?: ReactNode;
  edges?: SafeAreaEdge[];
};

const DEFAULT_EDGES: SafeAreaEdge[] = ["top", "right", "bottom", "left"];

export function SafeAreaEdgesView({
  children,
  edges = DEFAULT_EDGES,
  style,
  ...rest
}: SafeAreaEdgesViewProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
  };
  return (
    <View style={[pad, style]} {...rest}>
      {children}
    </View>
  );
}
