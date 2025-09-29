import { create } from "zustand";

import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

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
  storage: sessionStorage,
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
        setAuthReady: base.setAuthReady as any,
        setIsAuthenticated: base.setIsAuthenticated as any,
        setUserMeta: base.setUserMeta as any,
        setFeatureGates: base.setFeatureGates as any,
      } as unknown as SessionState;
    const persistedData = persisted as Record<string, unknown>;
    const safe = {
      userMeta: (persistedData.userMeta as UserMeta | null) ?? null,
      featureGates:
        (persistedData.featureGates as Record<string, boolean>) ?? {},
    } as Pick<SessionState, "userMeta" | "featureGates">;
    return { ...base, ...safe } as SessionState;
  },
}) as unknown as import("zustand").StateCreator<SessionState>;

const withDev = withDevtools<SessionState>("session")(
  withPersist,
) as unknown as import("zustand").StateCreator<SessionState>;

export const useSessionStore = create<SessionState>()(withDev);
