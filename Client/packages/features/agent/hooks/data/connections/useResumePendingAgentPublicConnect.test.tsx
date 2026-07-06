import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRequestAsInitiator = vi.fn();
const enqueueToast = vi.fn();

const mockUserData = vi.hoisted(() => ({
  userProfile: { id: "client-1", roles: [] as string[], has_preferences: true },
  userProfileLoading: false,
}));

const mockAuthStore = vi.hoisted(() => ({
  authReady: true,
  isAuthenticated: true,
  user: { has_preferences: true },
}));

vi.mock("./useConnectionRequests", () => ({
  useConnectionRequests: () => ({ createRequestAsInitiator }),
}));

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

vi.mock("packages/hooks/data/user/useUserData", () => ({
  useUserData: () => mockUserData,
}));

vi.mock("packages/store", () => ({
  useAuthStore: (
    selector: (s: {
      authReady: boolean;
      isAuthenticated: boolean;
      user: { has_preferences: boolean };
    }) => unknown
  ) => selector(mockAuthStore),
  useUIStore: (selector: (s: { enqueueToast: typeof enqueueToast }) => unknown) =>
    selector({ enqueueToast }),
}));

vi.mock("packages/utils/growth/agent", () => ({
  peekPendingPublicAgentConnect: vi.fn(),
  clearPendingPublicAgentConnect: vi.fn(),
}));

import {
  clearPendingPublicAgentConnect,
  peekPendingPublicAgentConnect,
} from "packages/utils/growth/agent";

import { useResumePendingAgentPublicConnect } from "./useResumePendingAgentPublicConnect";

describe("useResumePendingAgentPublicConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(peekPendingPublicAgentConnect).mockReturnValue(null);
    createRequestAsInitiator.mockResolvedValue({ alreadyPending: false });
    mockUserData.userProfile = { id: "client-1", roles: [], has_preferences: true };
    mockUserData.userProfileLoading = false;
    mockAuthStore.authReady = true;
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { has_preferences: true };
  });

  it("does nothing when there is no pending public connect intent", async () => {
    renderHook(() => useResumePendingAgentPublicConnect());
    await waitFor(() => {
      expect(createRequestAsInitiator).not.toHaveBeenCalled();
    });
  });

  it("creates a connection request when pending agent id differs from profile", async () => {
    vi.mocked(peekPendingPublicAgentConnect).mockReturnValue("agent-99");

    renderHook(() => useResumePendingAgentPublicConnect());

    await waitFor(() => {
      expect(createRequestAsInitiator).toHaveBeenCalledWith(
        "client-1",
        "agent-99",
        false,
        undefined
      );
    });
    expect(clearPendingPublicAgentConnect).toHaveBeenCalled();
    expect(enqueueToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
  });

  it("does not resume connect before onboarding is complete", async () => {
    vi.mocked(peekPendingPublicAgentConnect).mockReturnValue("agent-99");
    mockUserData.userProfile = { id: "client-1", roles: [], has_preferences: false };
    mockAuthStore.user = { has_preferences: false };

    renderHook(() => useResumePendingAgentPublicConnect());

    await waitFor(() => {
      expect(createRequestAsInitiator).not.toHaveBeenCalled();
    });
  });

  it("clears pending intent when it matches the current user id", async () => {
    vi.mocked(peekPendingPublicAgentConnect).mockReturnValue("client-1");

    renderHook(() => useResumePendingAgentPublicConnect());

    await waitFor(() => {
      expect(clearPendingPublicAgentConnect).toHaveBeenCalled();
    });
    expect(createRequestAsInitiator).not.toHaveBeenCalled();
  });
});
