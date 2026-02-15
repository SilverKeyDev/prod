import type { AuthStatus } from "../../../../../packages/store/auth.slice";
import type { UserProfile } from "../../../../../packages/schemas/auth/user";

export type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  authReady: boolean;
  status: AuthStatus;
  logout: () => Promise<void>;
};
