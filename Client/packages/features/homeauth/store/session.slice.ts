import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

export type UserMeta = {
  id?: string;
  email?: string;
  name?: string;
  isAgent?: boolean;
};

export type SessionState = {
  authReady: boolean;
  isAuthenticated: boolean;
  userMeta: UserMeta | null;
  featureGates: Record<string, boolean>;

  setAuthReady: (ready: boolean) => void;
  setIsAuthenticated: (value: boolean) => void;
  setUserMeta: (meta: UserMeta | null) => void;
  setFeatureGates: (flags: Record<string, boolean>) => void;

  /**
   * Soft reset that preserves non-sensitive preferences (e.g., featureGates)
   * but clears session-sensitive data such as userMeta and auth flags.
   */
  softReset: () => void;
  reset: () => void;
};

const initialState = (): Pick<
  SessionState,
  "authReady" | "isAuthenticated" | "userMeta" | "featureGates"
> => ({
  authReady: false,
  isAuthenticated: false,
  userMeta: null,
  featureGates: {},
});

const baseCreator: import("zustand").StateCreator<SessionState> = (set) => ({
  ...initialState(),

  setAuthReady: (ready) => set({ authReady: ready }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUserMeta: (meta) => set({ userMeta: meta }),
  setFeatureGates: (flags) => set({ featureGates: { ...flags } }),

  softReset: () =>
    set((state) => ({
      authReady: false,
      isAuthenticated: false,
      userMeta: null,
      featureGates: state.featureGates, // preserve
    })),

  // placeholder; replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<SessionState>(baseCreator, (set) => ({
  ...initialState(),
  setAuthReady: (ready) => set({ authReady: ready }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUserMeta: (meta) => set({ userMeta: meta }),
  setFeatureGates: (flags) => set({ featureGates: { ...flags } }),
  softReset: () =>
    set((state) => ({
      authReady: false,
      isAuthenticated: false,
      userMeta: null,
      featureGates: state.featureGates,
    })),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<SessionState>;

const withPersist = persistSafe<SessionState>(withReset, {
  name: "session-store",
  version: 1,
  storage: getSessionStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: SessionState) => ({
    // Persist only NON-sensitive meta; never tokens
    userMeta: state.userMeta
      ? {
          id: state.userMeta.id,
          email: state.userMeta.email,
          name: state.userMeta.name,
          isAgent: state.userMeta.isAgent,
        }
      : null,
    featureGates: state.featureGates,
  }),
  migrate: (persisted: unknown, _version: number): SessionState => {
    const base = { ...initialState() } as SessionState;
    if (!persisted)
      return {
        ...base,
        reset: () => {},
        softReset: () => {},
        setAuthReady: base.setAuthReady as (ready: boolean) => void,
        setIsAuthenticated: base.setIsAuthenticated as (value: boolean) => void,
        setUserMeta: base.setUserMeta as (meta: UserMeta | null) => void,
        setFeatureGates: base.setFeatureGates as (flags: Record<string, boolean>) => void,
      } as unknown as SessionState;
    const persistedData = persisted as Record<string, unknown>;
    const safe = {
      userMeta: (persistedData.userMeta as UserMeta | null) ?? null,
      featureGates: (persistedData.featureGates as Record<string, boolean>) ?? {},
    } as Pick<SessionState, "userMeta" | "featureGates">;
    return { ...base, ...safe } as SessionState;
  },
}) as unknown as import("zustand").StateCreator<SessionState>;

const withDev = withDevtools<SessionState>("session")(
  withPersist
) as unknown as import("zustand").StateCreator<SessionState>;

export const useSessionStore = create<SessionState>()(withDev);
