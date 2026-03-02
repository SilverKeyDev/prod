import { useSearchRefresh } from "packages/contexts";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useSearchViewStore } from "packages/store";
import { AccessibleLink } from "packages/ui/components/index.web";

/** Search tab route - shared constant so packages do not depend on app layout. */
const SEARCH_HREF = "/search";

type SearchNavLinkProps = {
  className?: string;
  title?: string;
  children: React.ReactNode;
  /** Unified accessibility label. Maps to aria-label on the underlying Link. */
  label?: string;
  "aria-current"?: "page" | undefined;
  onClick?: () => void;
};

/**
 * Link for Search tab - when already on /search with Reels mode, triggers refresh instead of navigating
 */
export function SearchNavLink({
  className,
  title,
  children,
  label,
  "aria-current": ariaCurrent,
  onClick: onLinkClick,
}: SearchNavLinkProps) {
  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  const refresh = useSearchRefresh();
  const mode = useSearchViewStore((s) => s.mode);
  const isOnSearch = route.pathname.startsWith("/search");
  const shouldRefresh = isOnSearch && mode === "reels" && refresh?.triggerRefresh;

  const handleClick = (e: React.MouseEvent) => {
    log.info(LOG_CATEGORIES.ROUTING, "[NAV] SearchNavLink click", {
      pathname: route.pathname,
      isOnSearch,
      mode,
      shouldRefresh: !!shouldRefresh,
      willPreventDefault: shouldRefresh,
    });
    if (shouldRefresh) {
      e.preventDefault();
      refresh.triggerRefresh();
    }
    onLinkClick?.();
  };

  return (
    <AccessibleLink
      to={SEARCH_HREF}
      onClick={handleClick}
      className={className}
      title={title}
      label={label}
      aria-current={ariaCurrent}
    >
      {children}
    </AccessibleLink>
  );
}
