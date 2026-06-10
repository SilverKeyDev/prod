import type { ComponentProps } from "react";

import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { pathFor } from "packages/navigation/router/paths";
import { useSearchViewStore } from "packages/store";
import { getActiveDashboardKey } from "packages/utils/core/layout/dashboardLayoutConfig";

import { AccessibleLink } from "@/components/ui";

function genNavId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type SearchNavLinkProps = {
  className?: string;
  title?: string;
  children: React.ReactNode;
  /** Unified accessibility label. Maps to aria-label on the underlying Link. */
  label?: string;
  "aria-current"?: "page" | undefined;
  onClick?: () => void;
  /** Called before navigation log with same navId for correlating downstream logs (e.g. MobileBottomNav). */
  onNavigateClick?: (navId: string) => void;
} & Pick<ComponentProps<typeof AccessibleLink>, "onMouseEnter" | "onFocus" | "onTouchStart">;

/**
 * Link for Search tab - uses standard navigation semantics while logging route context.
 */
export function SearchNavLink({
  className,
  title,
  children,
  label,
  "aria-current": ariaCurrent,
  onClick: onLinkClick,
  onNavigateClick,
  onMouseEnter,
  onFocus,
  onTouchStart,
}: SearchNavLinkProps) {
  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  const searchHref = pathFor("SEARCH");
  const mode = useSearchViewStore((s) => s.mode);
  const isOnSearch = getActiveDashboardKey(route.pathname) === "search";

  const handleClick = () => {
    const navId = genNavId();
    onNavigateClick?.(navId);
    log.info("ROUTING", "[NAV] SearchNavLink click", {
      navId,
      target: searchHref,
      prevPathname: route.pathname,
      pathname: route.pathname,
      isOnSearch,
      mode,
    });
    onLinkClick?.();
  };

  return (
    <AccessibleLink
      to={searchHref}
      onClick={handleClick}
      className={className}
      title={title}
      label={label}
      aria-current={ariaCurrent}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
    >
      {children}
    </AccessibleLink>
  );
}
