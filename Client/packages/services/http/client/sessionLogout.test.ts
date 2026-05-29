import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: { init: vi.fn(), capture: vi.fn() },
}));

const storeState = {
  user: { id: "u1" },
  isAuthenticated: true,
  authStatus: "authenticated" as const,
  authReady: true,
  setUser: vi.fn(),
  setIsAuthenticated: vi.fn(),
  setAuthStatus: vi.fn(),
  setAuthReady: vi.fn(),
};

vi.mock("packages/store", () => ({
  useAuthStore: {
    getState: () => storeState,
  },
}));

const locationHref = vi.fn();
const mockPathname = vi.hoisted(() => ({ current: "/dashboard" }));

function buildMockLocation() {
  const location = { pathname: mockPathname.current, _href: "" };
  Object.defineProperty(location, "href", {
    get: () => location._href,
    set: (value: string) => {
      location._href = value;
      locationHref(value);
    },
    configurable: true,
  });
  return location;
}

vi.mock("packages/utils/platform", () => ({
  getWindow: () => ({
    location: buildMockLocation(),
    dispatchEvent: vi.fn(),
  }),
}));

vi.mock("packages/utils/storage/platformStorage", () => ({
  getSessionStorage: () => ({ removeItem: vi.fn() }),
  getLocalStorage: () => ({ removeItem: vi.fn() }),
}));

describe("sessionLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.current = "/dashboard";
    storeState.authReady = true;
    storeState.authStatus = "authenticated";
  });

  it("applyLocalUnauthenticatedState keeps authReady true", async () => {
    const { applyLocalUnauthenticatedState } = await import("./sessionLogout");
    applyLocalUnauthenticatedState();
    expect(storeState.setAuthReady).toHaveBeenCalledWith(true);
    expect(storeState.setAuthStatus).toHaveBeenCalledWith("unauthenticated");
    expect(storeState.setIsAuthenticated).toHaveBeenCalledWith(false);
  });

  it("redirectToLoginIfNeeded skips login path", async () => {
    mockPathname.current = "/login";
    const { redirectToLoginIfNeeded } = await import("./sessionLogout");
    redirectToLoginIfNeeded();
    expect(locationHref).not.toHaveBeenCalled();
  });

  it("redirectToLoginIfNeeded navigates from protected route", async () => {
    const { redirectToLoginIfNeeded } = await import("./sessionLogout");
    redirectToLoginIfNeeded();
    expect(locationHref).toHaveBeenCalledWith("/login");
  });
});
