import { Button, type ButtonProps } from "packages/ui/components/index.web";

/**
 * Interaction overrides for feed/reels overlay buttons: no hover, no focus ring, no active highlight.
 * Keep text white on active so buttons do not turn black when pressed.
 * Export for use on other feed overlay controls (e.g. IconButton).
 */
export const FEED_ACTION_INTERACTION_CLASS =
  "hover:bg-transparent hover:text-white focus:outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0 active:bg-transparent active:text-white";

/**
 * Profile picture / avatar in feed/reels: no border, no outline.
 * Apply to img and placeholder elements wherever feed avatars are shown.
 */
export const FEED_AVATAR_IMAGE_CLASS = "rounded-full object-cover border-0 outline-none";

/**
 * Standardized action button for feed/reels overlay.
 * No border ever, no hover background, no focus ring, no active highlight — icon-only appearance.
 */
const FEED_ACTION_BUTTON_CLASS = `flex flex-col items-center gap-1 border-0 border-none bg-transparent text-white min-w-0 p-2 shadow-none outline-none hover:border-0 hover:shadow-none focus:border-0 focus:shadow-none active:border-0 disabled:border-0 ${FEED_ACTION_INTERACTION_CLASS}`;

export function FeedActionButton({ className = "", children, ...props }: ButtonProps) {
  return (
    <Button
      variant="ghost"
      size="md"
      className={`${FEED_ACTION_BUTTON_CLASS} ${className}`.trim()}
      {...props}
    >
      {children}
    </Button>
  );
}
