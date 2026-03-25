import type { UserProfile } from "./userProfile";

export type ResetPasswordStores = {
  setStoreUser: (user: UserProfile) => void;
  setStoreIsAuthenticated: (v: boolean) => void;
  setUserProfile: (profile: UserProfile & { name?: string }) => void;
};
