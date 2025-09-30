import type { AuthState } from "./useAuthState";
import type { AuthBootstrapStatus } from "./AuthProvider";

export type AuthContextType = {
  status: AuthBootstrapStatus;
  logout: () => Promise<void>;
} & AuthState;
