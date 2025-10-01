import type { UserProfile } from "../../../../../packages/schemas/user";
import type { AuthBootstrapStatus } from "./AuthProvider";

export type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authReady: boolean;
  status: AuthBootstrapStatus;
  logout: () => Promise<void>;
};
