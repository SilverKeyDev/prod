import React, { forwardRef } from "react";

export type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement>;

/**
 * Base Video primitive - <video> for web.
 * Native uses Video.native.tsx (placeholder or expo-av when available).
 */
const Video = forwardRef<HTMLVideoElement, VideoProps>(function Video(
  { className = "", children, ...props },
  ref
) {
  return (
    <video ref={ref} className={className} {...props}>
      <track kind="captions" />
      {children}
    </video>
  );
});

export default Video;
