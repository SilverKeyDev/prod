import type { ComponentProps } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { useSearchViewStore } from "packages/store";

import { AccessibleLink } from "@/components/ui";

/** Search tab route - shared constant so packages do not depend on app layout. */
const SEARCH_HREF = "/search";

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
  const mode = useSearchViewStore((s) => s.mode);
  const isOnSearch = route.pathname.startsWith("/search");

  const handleClick = () => {
    const navId = genNavId();
    onNavigateClick?.(navId);
    log.info(LOG_CATEGORIES.ROUTING, "[NAV] SearchNavLink click", {
      navId,
      target: "/search",
      prevPathname: route.pathname,
      pathname: route.pathname,
      isOnSearch,
      mode,
    });
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
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
    >
      {children}
    </AccessibleLink>
  );
}
