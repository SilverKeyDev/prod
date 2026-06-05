import React, { forwardRef } from "react";

import { Image } from "packages/ui/components/structure/primitives/media";

import type { BaseAppImageProps } from "./AppImage.shared";

export type AppImageProps = BaseAppImageProps &
  Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
    /**
     * Optional React Native–style source shape for parity with native.
     * If provided, `source.uri` is preferred over `uri`.
     */
    source?: {
      uri?: string;
    };
  };

/**
 * Cross-platform-friendly Image wrapper for web.
 * Maps `uri` / `source.uri` into the underlying `<img>` via the Image primitive.
 */
const AppImage = forwardRef<HTMLImageElement, AppImageProps>(function AppImage(
  { uri, source, alt, className, ...rest },
  ref
) {
  const resolvedUri = source?.uri ?? uri;

  return (
    <Image
      // Primitive handles src/source mapping; we always pass source for consistency.
      source={resolvedUri ? { uri: resolvedUri } : undefined}
      alt={alt ?? ""}
      className={className}
      ref={ref}
      {...rest}
    />
  );
});

export default AppImage;
