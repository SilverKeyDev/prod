import BodyText from "@ui/text/BodyText";

type NotificationBadgeProps = {
  count?: number;
  className?: string;
};

export default function NotificationBadge({ count = 0, className = "" }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 9 ? "9+" : count.toString();

  return (
    <div
      className={`bg-destructive-hover flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full text-white sm:h-5 sm:w-5 ${className}`}
      aria-label={`${count} unread message${count !== 1 ? "s" : ""}`}
    >
      <BodyText as="span" className="text-xs font-semibold leading-none sm:text-sm">
        {displayCount}
      </BodyText>
    </div>
  );
}
