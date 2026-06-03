import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

export type UserPreferences = {
  preferences_version?: string;
  home_location?: {
    latitude: number;
    longitude: number;
  };
  commute_time?: number;
  commute_mode?: string;
  important_locations?: Array<{
    address: string;
    commute_tolerance?: number;
    latitude?: number;
    longitude?: number;
  }>;
  [key: string]: unknown;
};

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  roles?: string[];
  [key: string]: unknown;
};

export type UserState = {
  // User data
  userProfile: UserProfile | null;
  userPreferences: UserPreferences | null;
  userLoading: boolean;
  userError: string | null;

  // Actions
  setUserProfile: (profile: UserProfile | null) => void;
  setUserPreferences: (preferences: UserPreferences | null) => void;
  setUserLoading: (loading: boolean) => void;
  setUserError: (error: string | null) => void;

  reset: () => void; // Added by withResettable
};

const initialState = () => ({
  userProfile: null,
  userPreferences: null,
  userLoading: false,
  userError: null,
});

const baseCreator: import("zustand").StateCreator<UserState> = (set) => ({
  ...initialState(),

  setUserProfile: (profile) => set({ userProfile: profile }),
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),
  setUserLoading: (loading) => set({ userLoading: loading }),
  setUserError: (error) => set({ userError: error }),

  // placeholder; replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<UserState>(baseCreator, (set) => ({
  ...initialState(),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),
  setUserLoading: (loading) => set({ userLoading: loading }),
  setUserError: (error) => set({ userError: error }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<UserState>;

const withPersist = persistSafe<UserState>(withReset, {
  name: "user-store",
  version: 1,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: UserState) => ({
    // Only persist non-sensitive user data
    userProfile: state.userProfile
      ? {
          id: state.userProfile.id,
          email: state.userProfile.email,
          name: state.userProfile.name,
          username: state.userProfile.username,
          roles: state.userProfile.roles,
        }
      : null,
    userPreferences: state.userPreferences,
  }),
}) as unknown as import("zustand").StateCreator<UserState>;

const withDev = withDevtools<UserState>("user")(
  withPersist
) as unknown as import("zustand").StateCreator<UserState>;

export const useUserStore = create<UserState>()(withDev);
