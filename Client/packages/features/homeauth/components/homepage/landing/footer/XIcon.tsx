import { X_ICON_PATH } from "./xIconPath";

export type XIconProps = { size?: number; className?: string };

/** Web X (Twitter) mark. Native uses XIcon.native.tsx — React Native cannot mount <svg>/<path>. */
export function XIcon({ size = 16, className }: XIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d={X_ICON_PATH} />
    </svg>
  );
}
