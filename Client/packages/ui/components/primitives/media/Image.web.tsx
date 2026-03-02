import React, { forwardRef } from "react";

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** RN-style source; web maps to src. */
  source?: { uri?: string };
};

/**
 * Base Image primitive — <img> for web.
 * Native uses RN Image (Image.native.tsx). Accepts source (maps to src) for cross-platform API.
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { className = "", alt, src, source, ...props },
  ref
) {
  const resolvedSrc = src ?? source?.uri ?? undefined;
  return <img ref={ref} className={className} alt={alt ?? ""} src={resolvedSrc} {...props} />;
});

export default Image;
