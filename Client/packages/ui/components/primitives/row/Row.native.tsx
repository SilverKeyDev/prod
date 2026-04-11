import React, { forwardRef } from "react";

import { View, type ViewProps } from "react-native";

import { ROW_DEFAULT_CLASSES } from "packages/ui/styles/variants/boxStyles";

export type RowProps = ViewProps & { className?: string };

/**
 * Row primitive - horizontal flex flex-row container for React Native.
 * NativeWind applies Tailwind classes via className.
 */
const Row = forwardRef<View, RowProps>(function Row(
  { className, style, children, ...props },
  ref,
) {
  const combinedClassName = [ROW_DEFAULT_CLASSES, className]
    .filter(Boolean)
    .join(" ");
  return (
    <View ref={ref} className={combinedClassName} style={style} {...props}>
      {children}
    </View>
  );
});

export default Row;
