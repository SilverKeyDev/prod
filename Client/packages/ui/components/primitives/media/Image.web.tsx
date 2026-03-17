import React, { forwardRef } from "react";

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** RN-style source; web maps to src. */
  source?: { uri?: string };
  /** Unified label for a11y; maps to alt on web. */
  label?: string;
};

/**
 * Base Image primitive — <img> for web.
 * Native uses RN Image (Image.native.tsx). Accepts source (maps to src) for cross-platform API.
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { className = "", alt, label, src, source, ...props },
  ref
) {
  const resolvedSrc = src ?? source?.uri ?? undefined;
  const resolvedAlt = alt ?? label ?? "";
  return <img ref={ref} className={className} alt={resolvedAlt} src={resolvedSrc} {...props} />;
});

export default Image;
