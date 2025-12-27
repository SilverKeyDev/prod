type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export default function NotificationBadge({
  count,
  className = "",
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <div
      className={`flex h-4 w-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-light text-white sm:h-5 sm:w-5 ${className}`}
      aria-label={`${count} unread message${count !== 1 ? "s" : ""}`}
    >
      <span className="text-xs font-semibold leading-none sm:text-sm">
        {displayCount}
      </span>
    </div>
  );
}

