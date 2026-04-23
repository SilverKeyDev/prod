/**
 * Web: wrap react-router-dom Link with adapter props (to, state).
 */

import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { LinkProps as AdapterLinkProps } from "packages/navigation/types/navigationTypes";

export type LinkProps = AdapterLinkProps & {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  [key: string]: unknown;
};

export function Link({ to, state, children, ...rest }: LinkProps): JSX.Element {
  return (
    <RouterLink to={to} state={state} {...rest}>
      {children}
    </RouterLink>
  );
}
