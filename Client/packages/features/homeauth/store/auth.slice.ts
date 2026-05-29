import { create } from "zustand";

import type { UserProfile } from "packages/features/homeauth/types/index";
import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export type LoginResult = { success: boolean; needsVerification?: boolean };

export type AuthState = {
  // Auth state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authReady: boolean;
  authStatus: AuthStatus; // 3-state: checking/authenticated/unauthenticated
  /**
   * One-time redirect target used by platform routers (e.g. RN) after auth transitions.
   * Not persisted.
   */
  postAuthRedirectPath: string | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  setAuthStatus: (status: AuthStatus) => void;
  setPostAuthRedirectPath: (path: string | null) => void;

  // Auth actions (will be implemented by hooks)
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;

  // Setters for integration hook to inject implementations (no getState)
  setLogin: (fn: AuthState["login"]) => void;
  setLogout: (fn: AuthState["logout"]) => void;
  setRefreshToken: (fn: AuthState["refreshToken"]) => void;

  reset: () => void; // Added by withResettable
};

const initialState = (): Omit<
  AuthState,
  | "setUser"
  | "setIsAuthenticated"
  | "setIsLoading"
  | "setError"
  | "setAuthReady"
  | "setAuthStatus"
  | "setPostAuthRedirectPath"
  | "login"
  | "logout"
  | "refreshToken"
  | "clearError"
  | "setLogin"
  | "setLogout"
  | "setRefreshToken"
  | "reset"
> => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authReady: false,
  authStatus: "checking", // Start in checking state
  postAuthRedirectPath: null,
});

const baseCreator: import("zustand").StateCreator<AuthState> = (set) => ({
  ...initialState(),

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAuthReady: (authReady) => set({ authReady }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  setPostAuthRedirectPath: (postAuthRedirectPath) => set({ postAuthRedirectPath }),

  // Auth actions will be implemented by hooks that use this store
  login: () => {
    // login should be implemented by useAuthStoreIntegration hook
    return Promise.resolve({ success: false });
  },
  logout: () => {
    // logout should be implemented by useAuthStoreIntegration hook
  },
  refreshToken: () => {
    // refreshToken should be implemented by useAuthStoreIntegration hook
    return Promise.resolve(false);
  },
  clearError: () => {
    set({ error: null });
  },

  setLogin: (fn) => set({ login: fn }),
  setLogout: (fn) => set({ logout: fn }),
  setRefreshToken: (fn) => set({ refreshToken: fn }),

  // placeholder; will be replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<AuthState>(baseCreator, (set) => ({
  ...initialState(),
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAuthReady: (authReady) => set({ authReady }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  setPostAuthRedirectPath: (postAuthRedirectPath) => set({ postAuthRedirectPath }),
  login: async () => ({ success: false }),
  logout: () => {},
  refreshToken: async () => false,
  clearError: () => set({ error: null }),
  setLogin: (fn) => set({ login: fn }),
  setLogout: (fn) => set({ logout: fn }),
  setRefreshToken: (fn) => set({ refreshToken: fn }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<AuthState>;

const withPersist = persistSafe<AuthState>(withReset, {
  name: "auth-store",
  version: 1,
  storage: getSessionStorage() as import("zustand/middleware").StateStorage, // Use sessionStorage for security
  partialize: (state: AuthState) => ({
    // Only persist non-sensitive user data (no tokens)
    user: state.user
      ? {
          id: state.user.id,
          email: state.user.email,
          name: state.user.name,
          created_at: state.user.created_at,
          is_active: state.user.is_active,
          has_preferences: state.user.has_preferences,
          is_agent: state.user.is_agent,
        }
      : null,
    isAuthenticated: state.isAuthenticated,
    authReady: state.authReady,
    authStatus: state.authStatus,
  }),
  migrate: (persisted: unknown, _version: number): AuthState => {
    const base = { ...initialState() } as AuthState;
    if (!persisted)
      return {
        ...base,
        reset: () => {},
        setUser: base.setUser,
        setIsAuthenticated: base.setIsAuthenticated,
        setIsLoading: base.setIsLoading,
        setError: base.setError,
        setAuthReady: base.setAuthReady,
        setAuthStatus: base.setAuthStatus,
        login: base.login,
        logout: base.logout,
        refreshToken: base.refreshToken,
        clearError: base.clearError,
        setLogin: base.setLogin,
        setLogout: base.setLogout,
        setRefreshToken: base.setRefreshToken,
      } as unknown as AuthState;
    const persistedData = persisted as Record<string, unknown>;
    const safe = {
      user: (persistedData.user as UserProfile | null) ?? null,
      isAuthenticated: (persistedData.isAuthenticated as boolean) ?? false,
      authReady: (persistedData.authReady as boolean) ?? false,
      authStatus: (persistedData.authStatus as AuthStatus) ?? "checking",
    } as Pick<AuthState, "user" | "isAuthenticated" | "authReady" | "authStatus">;
    return { ...base, ...safe } as AuthState;
  },
}) as unknown as import("zustand").StateCreator<AuthState>;

const withDev = withDevtools<AuthState>("auth")(
  withPersist
) as unknown as import("zustand").StateCreator<AuthState>;

export const useAuthStore = create<AuthState>()(withDev);
