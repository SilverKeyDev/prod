import React, { forwardRef } from "react";

export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Base Image component — first layer of abstraction over <img>.
 * Use this instead of raw <img> for consistency and future RN/media abstraction.
 */
const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { className = "", alt, ...props },
  ref,
) {
  return <img ref={ref} className={className} alt={alt ?? ""} {...props} />;
});

export default Image;
