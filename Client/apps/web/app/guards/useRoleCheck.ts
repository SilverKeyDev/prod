import type { UserRole, UserProfile } from "../../../../packages/schemas/user";
import { useAuthStoreIntegration } from "../../../../packages/hooks/store/useAuthStoreIntegration";

/**
 * Hook to check if current user has specific roles
 */
export function useRoleCheck() {
  const { user } = useAuthStoreIntegration();

  // Type guard to check if user has roles property
  const hasRoles = (
    user: UserProfile | null,
  ): user is UserProfile & { roles: UserRole[] } => {
    return user !== null && Array.isArray(user.roles);
  };

  const getUserRoles = (): UserRole[] => {
    return hasRoles(user) ? user.roles : [];
  };

  const hasRole = (role: UserRole): boolean => {
    const userRoles = getUserRoles();
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    const userRoles = getUserRoles();
    return roles.some((role) => userRoles.includes(role));
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    const userRoles = getUserRoles();
    return roles.every((role) => userRoles.includes(role));
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    userRoles: getUserRoles(),
  };
}
