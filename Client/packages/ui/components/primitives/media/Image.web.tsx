import React, { forwardRef } from "react";

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  /**
   * RN-style source; web maps `source.uri` to `src`.
   * `number` is a Metro `require()` module id (native only); web code should use `src` or `source.uri`.
   */
  source?: { uri?: string } | number;
  /** Unified label for a11y; maps to alt on web. */
  label?: string;
};

/**
 * Base Image primitive - <img> for web.
 * Native uses RN Image (Image.native.tsx). Accepts source (maps to src) for cross-platform API.
 *
 * Performance defaults:
 * - loading="lazy" for below-fold images (override with loading="eager" for LCP images)
 * - decoding="async" for non-blocking decode
 * - fetchPriority can be set to "high" for above-the-fold images
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    className = "",
    alt,
    label,
    src,
    source,
    fetchPriority,
    loading = "lazy",
    decoding = "async",
    ...props
  },
  ref
) {
  const resolvedSrc = src ?? source?.uri ?? undefined;
  const resolvedAlt = alt ?? label ?? "";
  return (
    <img
      ref={ref}
      className={className}
      alt={resolvedAlt}
      src={resolvedSrc}
      loading={loading}
      decoding={decoding}
      {...props}
      fetchpriority={fetchPriority}
    />
  );
});

export default Image;
