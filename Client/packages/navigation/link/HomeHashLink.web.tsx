import { type MouseEvent, type ReactNode, useCallback } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { ROUTES } from "packages/navigation/types/routes";

export type HomeHashLinkProps = {
  /** Target element `id` on the home landing page (e.g. `agents` for `id="agents"`). */
  sectionId: string;
  className?: string;
  children?: ReactNode;
  title?: string;
};

/**
 * Smooth-scroll to a section on `/` when already on home; otherwise navigates to `/#sectionId`
 * and lets {@link useLandingHashScroll} scroll after the route is active.
 */
export function HomeHashLink({ sectionId, className, children, title }: HomeHashLinkProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const href = `${ROUTES.HOME}#${sectionId}`;

  const onClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const onHome = pathname === ROUTES.HOME || pathname === "";
      if (onHome) {
        scrollToLandingSection(sectionId);
        return;
      }
      void navigate({ pathname: ROUTES.HOME, hash: sectionId });
    },
    [navigate, pathname, sectionId]
  );

  return (
    <a href={href} onClick={onClick} className={className} title={title}>
      {children}
    </a>
  );
}
