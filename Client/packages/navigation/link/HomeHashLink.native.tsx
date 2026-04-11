import type { ReactNode } from "react";

import { ROUTES } from "packages/navigation/types/routes";

import { Link } from "./Link.native";

export type HomeHashLinkProps = {
  sectionId: string;
  className?: string;
  children?: ReactNode;
  title?: string;
};

/** In-page sections are web-only; native goes to home. */
export function HomeHashLink({
  sectionId: _sectionId,
  className,
  children,
  title,
  ...rest
}: HomeHashLinkProps) {
  return (
    <Link to={ROUTES.HOME} className={className} title={title} {...rest}>
      {children}
    </Link>
  );
}
