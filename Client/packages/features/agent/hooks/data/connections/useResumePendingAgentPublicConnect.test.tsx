import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useResumePendingAgentPublicConnect } from "./useResumePendingAgentPublicConnect";

const createRequestAsInitiator = vi.fn();
const enqueueToast = vi.fn();
const navigate = vi.fn();
const getCurrentRoute = vi.fn(() => ({ pathname: "/dashboard" }));

vi.mock("./useConnectionRequests", () => ({
  useConnectionRequests: () => ({ createRequestAsInitiator }),
}));

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

vi.mock("packages/hooks/data/user/useUserData", () => ({
  useUserData: () => ({
    userProfile: { id: "client-1", is_agent: false },
    userProfileLoading: false,
  }),
}));

vi.mock("packages/navigation", () => ({
  ROUTES: { ONBOARDING: "/onboarding" },
  useNavigation: () => ({ getCurrentRoute, navigate }),
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { authReady: boolean; isAuthenticated: boolean }) => unknown) =>
    selector({ authReady: true, isAuthenticated: true }),
  useUIStore: (selector: (s: { enqueueToast: typeof enqueueToast }) => unknown) =>
    selector({ enqueueToast }),
}));

vi.mock("packages/utils/agent", () => ({
  peekPendingPublicAgentConnect: vi.fn(),
  clearPendingPublicAgentConnect: vi.fn(),
}));

import {
  clearPendingPublicAgentConnect,
  peekPendingPublicAgentConnect,
} from "packages/utils/agent";

describe("useResumePendingAgentPublicConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(peekPendingPublicAgentConnect).mockReturnValue(null);
    createRequestAsInitiator.mockResolvedValue({ alreadyPending: false });
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
    expect(navigate).toHaveBeenCalledWith("DASHBOARD", undefined, { replace: true });
    expect(enqueueToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
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
