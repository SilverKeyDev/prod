import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "packages/config";
import type { AuthState, UserState } from "packages/features/homeauth/store";
import { useAuthStore, useUserStore } from "packages/store";

import { useSecureAuth } from "./useSecureAuth";

vi.mock("packages/store", () => ({
  useAuthStore: vi.fn(),
  useUserStore: vi.fn(),
}));

vi.mock("./useSecureAuthEffects", () => ({
  useProactiveTokenRefresh: () => {},
  useVisibilityRefresh: () => {},
  useAuthReadyDispatch: () => {},
}));

vi.mock("./utils/logoutCleanup", () => ({
  clearSessionStorageForLogout: vi.fn(),
}));

vi.mock("packages/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/config")>();
  return {
    ...actual,
    authApi: {
      login: vi.fn(),
      logout: vi.fn(),
      verifySession: vi.fn(),
      refreshToken: vi.fn(),
      signup: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      resendCode: vi.fn(),
      verify: vi.fn(),
    },
  };
});

vi.mock("packages/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/utils")>();
  return { ...actual, getWindow: () => null };
});

vi.mock("packages/services/security/errorReporting", () => ({
  reportSecurityEvent: vi.fn(),
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
  },
  LOG_CATEGORIES: {
    AUTH: "auth",
    ERRORS: "errors",
    SECURITY: "security",
  },
}));

function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    authReady: true,
    authStatus: "unauthenticated",
    postAuthRedirectPath: null,
    setUser: vi.fn(),
    setIsAuthenticated: vi.fn(),
    setIsLoading: vi.fn(),
    setError: vi.fn(),
    setAuthReady: vi.fn(),
    setAuthStatus: vi.fn(),
    setPostAuthRedirectPath: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(async () => false),
    clearError: vi.fn(),
    setLogin: vi.fn(),
    setLogout: vi.fn(),
    setRefreshToken: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function createUserState(): UserState {
  return {
    userProfile: null,
    userPreferences: null,
    userLoading: false,
    userError: null,
    setUserProfile: vi.fn(),
    setUserPreferences: vi.fn(),
    setUserLoading: vi.fn(),
    setUserError: vi.fn(),
    reset: vi.fn(),
  };
}

describe("useSecureAuth", () => {
  let queryClient: QueryClient;
  let authState: AuthState;
  let userState: UserState;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authState = createAuthState();
    userState = createUserState();
    vi.mocked(useAuthStore).mockImplementation((sel) => sel(authState));
    vi.mocked(useUserStore).mockImplementation((sel) => sel(userState));
  });

  it("login calls authApi.login and updates store on success", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      user: {
        id: "u1",
        email: "a@b.com",
        name: "A",
        user_sub: "sub",
        auth_user_kind: "session",
        phone: null,
        is_agent: false,
        auth_method: "cognito",
      },
    } as never);

    const { result } = renderHook(() => useSecureAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.login("a@b.com", "pw");

    await waitFor(() => {
      expect(authState.setUser).toHaveBeenCalled();
      expect(authState.setIsAuthenticated).toHaveBeenCalledWith(true);
    });
    expect(authApi.login).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "pw",
    });
  });

  it("logout calls authApi.logout and clears store setters", async () => {
    vi.mocked(authApi.logout).mockResolvedValue({ success: true } as never);

    const { result } = renderHook(() => useSecureAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.logout();

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalled();
      expect(authState.setUser).toHaveBeenCalledWith(null);
      expect(authState.setIsAuthenticated).toHaveBeenCalledWith(false);
    });
  });
});
