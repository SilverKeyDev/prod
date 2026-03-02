import React, { forwardRef } from "react";

import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export type TextProps = RNTextProps & { className?: string };

/**
 * Base Text primitive — RN <Text>. Use className for Tailwind typography (NativeWind).
 * Web uses polymorphic element (Text.web.tsx). Apply typography classes on Text, not on parent Box.
 */
const Text = forwardRef<RNText, TextProps>(function Text(
  { className, style, numberOfLines, children, ...props },
  ref
) {
  return (
    <RNText ref={ref} className={className} style={style} numberOfLines={numberOfLines} {...props}>
      {children}
    </RNText>
  );
});

export default Text;
