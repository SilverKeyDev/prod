import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@/features/homeauth/types";

import { performRefreshToken } from "./useSecureAuthFlows";

const postRefreshTokenWithRetryMock = vi.fn();

vi.mock("packages/services/http/client/auth/refreshTokenRetry", () => ({
  postRefreshTokenWithRetry: (...args: unknown[]) => postRefreshTokenWithRetryMock(...args),
  isTransientRefreshFailure: () => false,
}));

vi.mock("packages/services/http/client/auth", () => ({
  applyLocalUnauthenticatedState: vi.fn(),
}));

vi.mock("packages/features/homeauth/hooks/data/utils/logoutCleanup", () => ({
  getOptionalSessionStorageForLogout: () => null,
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: { AUTH: "auth" },
}));

const authStoreState = {
  user: null as UserProfile | null,
  setUser: vi.fn(),
  setIsAuthenticated: vi.fn(),
  setAuthStatus: vi.fn(),
  setAuthReady: vi.fn(),
};

vi.mock("packages/store", () => ({
  useAuthStore: {
    getState: () => authStoreState,
  },
  resetWorkspaceStore: vi.fn(),
  useDevAppPersonaStore: { setState: vi.fn() },
}));

describe("performRefreshToken", () => {
  const setUser = vi.fn();
  const setStoreUser = vi.fn();
  const setAccessToken = vi.fn();
  const setStoreIsAuthenticated = vi.fn();
  const setStoreAuthStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authStoreState.user = {
      id: "u1",
      email: "dev@usesilverkey.com",
      name: "Dev",
      created_at: null,
      is_active: true,
      has_preferences: true,
      is_agent: false,
      roles: ["integration_partner", "admin"],
      brokerage_org_ids: null,
    };
  });

  it("merges refresh user patch without dropping roles", async () => {
    postRefreshTokenWithRetryMock.mockResolvedValue({
      success: true,
      body: {
        success: true,
        user: {
          id: "u1",
          email: "dev@usesilverkey.com",
          name: "Dev",
          is_agent: false,
          auth_method: "cognito",
        },
      },
    });

    const ok = await performRefreshToken({
      setAccessToken,
      setUser,
      setStoreUser,
      setStoreIsAuthenticated,
      setStoreAuthStatus,
      currentUser: authStoreState.user,
    });

    expect(ok).toBe(true);
    expect(setUser).toHaveBeenCalledTimes(1);
    expect(setStoreUser).toHaveBeenCalledWith(setUser.mock.calls[0][0]);
    const merged = setUser.mock.calls[0][0] as UserProfile;
    expect(merged.roles).toEqual(["integration_partner", "admin"]);
    expect(merged.is_agent).toBe(false);
  });
});
