import React, { forwardRef } from "react";

export type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement>;

/**
 * Base Video component — first layer of abstraction over <video>.
 * Use this instead of raw <video> for consistency and future RN/media abstraction.
 * Supports ref forwarding for play/pause and other imperative handles.
 */
const Video = forwardRef<HTMLVideoElement, VideoProps>(function Video(
  { className = "", children, ...props },
  ref,
) {
  return (
    <video ref={ref} className={className} {...props}>
      <track kind="captions" />
      {children}
    </video>
  );
});

export default Video;
