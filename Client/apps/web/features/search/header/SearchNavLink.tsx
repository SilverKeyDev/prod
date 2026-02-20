import { useSearchRefresh } from "packages/contexts";
import { useNavigation } from "packages/navigation";
import { useSearchViewStore } from "packages/store";

import { SIDEBAR_TABS } from "@/app/layouts/sidebar/sidebarTabs.web";
import { AccessibleLink } from "@/components/ui/index.web";

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
  const shouldRefresh =
    isOnSearch && mode === "reels" && refresh?.triggerRefresh;

  const handleClick = (e: React.MouseEvent) => {
    if (shouldRefresh) {
      e.preventDefault();
      refresh.triggerRefresh();
    }
    onLinkClick?.();
  };

  return (
    <AccessibleLink
      to={SIDEBAR_TABS.search.href}
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
