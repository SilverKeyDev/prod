import React, { forwardRef } from "react";

import { View, type ViewProps } from "react-native";

export type BoxProps = ViewProps & { className?: string };

/**
 * Base Box primitive - View for React Native.
 * Web uses div (Box.web.tsx). Use this so layout is platform-agnostic.
 * NativeWind applies Tailwind classes via className.
 */
const Box = forwardRef<View, BoxProps>(function Box(
  { className, style, children, ...props },
  ref,
) {
  return (
    <View ref={ref} className={className} style={style} {...props}>
      {children}
    </View>
  );
});

export default Box;
