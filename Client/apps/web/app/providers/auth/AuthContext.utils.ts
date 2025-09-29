import type { AuthState } from "./useAuthState";

export type AuthContextType = {
  logout: () => Promise<void>;
} & AuthState;
