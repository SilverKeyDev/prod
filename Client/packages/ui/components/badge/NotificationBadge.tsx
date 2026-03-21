import { Box } from "packages/ui/components/primitives";

type NotificationBadgeProps = {
  count?: number;
  className?: string;
};

/**
 * Presence-only unread indicator (red dot). Count is used only to show/hide; the number is not displayed.
 */
export default function NotificationBadge({ count = 0, className = "" }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <Box
      className={`bg-destructive-hover pointer-events-none h-1.5 w-1.5 shrink-0 rounded-full ${className}`}
      aria-label="Unread messages"
    />
  );
}
