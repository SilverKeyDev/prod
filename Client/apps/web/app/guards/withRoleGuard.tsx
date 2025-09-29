import React from "react";

import { RoleGuard, type RoleGuardProps, type UserRole } from "./RoleGuard";

/**
 * Higher-order component version of RoleGuard
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  guardProps?: Omit<RoleGuardProps, "children" | "allowedRoles">,
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} {...guardProps}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
