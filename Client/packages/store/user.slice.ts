import { create } from "zustand";

import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

export type UserPreferences = {
  preferences_version?: string;
  home_location?: {
    latitude: number;
    longitude: number;
  };
  commute_time?: number;
  commute_mode?: string;
  important_locations?: Array<{
    name: string;
    latitude: number;
    longitude: number;
  }>;
  [key: string]: unknown;
};

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  is_agent?: boolean;
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
  storage: localStorage,
  partialize: (state: UserState) => ({
    // Only persist non-sensitive user data
    userProfile: state.userProfile
      ? {
          id: state.userProfile.id,
          email: state.userProfile.email,
          name: state.userProfile.name,
          username: state.userProfile.username,
          is_agent: state.userProfile.is_agent,
        }
      : null,
    userPreferences: state.userPreferences,
  }),
}) as unknown as import("zustand").StateCreator<UserState>;

const withDev = withDevtools<UserState>("user")(
  withPersist,
) as unknown as import("zustand").StateCreator<UserState>;

export const useUserStore = create<UserState>()(withDev);
