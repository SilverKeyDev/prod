/**
 * Authentication Provider
 * Supplies current user/session via React context
 * Only exposes logout function from hook/service - does not implement logout logic
 */

import type { ReactNode } from "react";

import { useLogout } from "../../../../../packages/hooks/ui/useLogout";
import { useAuthState } from "../auth/useAuthState";

import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState();
  const { logout } = useLogout();

  const contextValue = {
    ...authState,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthProvider;
