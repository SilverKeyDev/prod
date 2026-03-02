import React, { forwardRef } from "react";

import { Image as RNImage, type ImageProps as RNImageProps } from "react-native";

export type ImageProps = RNImageProps & { className?: string };

/**
 * Base Image primitive — RN Image for native.
 * Web uses img (Image.web.tsx). Use source={{ uri }} for cross-platform API.
 */
const Image = forwardRef<RNImage, ImageProps>(function Image(
  { source, className, style, ...props },
  ref
) {
  return <RNImage ref={ref} source={source} className={className} style={style} {...props} />;
});

export default Image;
