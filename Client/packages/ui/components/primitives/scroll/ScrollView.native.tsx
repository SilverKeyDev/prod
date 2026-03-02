import React, { forwardRef } from "react";

import {
  ScrollView as RNScrollView,
  type ScrollViewProps as RNScrollViewProps,
} from "react-native";

export type ScrollViewProps = RNScrollViewProps & { className?: string };

const ScrollView = forwardRef<RNScrollView, ScrollViewProps>(function ScrollView(
  { children, className, style, horizontal = false, ...props },
  ref
) {
  return (
    <RNScrollView ref={ref} className={className} style={style} horizontal={horizontal} {...props}>
      {children}
    </RNScrollView>
  );
});

export default ScrollView;
