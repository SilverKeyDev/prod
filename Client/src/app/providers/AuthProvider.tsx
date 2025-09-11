/**
 * Authentication Provider
 * Supplies current user/session via React context
 */

import { createContext, useContext, ReactNode } from "react";
import { useAuthState, AuthState } from "../../lib/authUtils";

interface AuthContextType extends AuthState {
  // Extends AuthState with additional context methods if needed in the future
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
