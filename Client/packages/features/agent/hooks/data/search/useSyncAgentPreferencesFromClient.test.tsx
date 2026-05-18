import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { preferencesApi } from "@/features/homeauth/api/preferences";

import { useSyncAgentPreferencesFromClient } from "./useSyncAgentPreferencesFromClient";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

vi.mock("packages/hooks/data/user/useUserData", () => ({
  useUserData: () => ({ userProfile: { id: "agent-1" } }),
}));

vi.mock("packages/hooks/ui", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

vi.mock("@/features/homeauth/api/preferences", () => ({
  preferencesApi: {
    getByUserId: vi.fn(),
    createOrUpdate: vi.fn(),
  },
}));

vi.mock("@/features/profile/utils", () => ({
  userPreferencesToOnboardingData: vi.fn(() => ({ budget: 500000 })),
  formDataToPreferencesPayload: vi.fn(() => ({ budget: 500000 })),
}));

import { showErrorToast, showSuccessToast } from "packages/hooks/ui";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useSyncAgentPreferencesFromClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs client preferences onto the agent account", async () => {
    vi.mocked(preferencesApi.getByUserId).mockResolvedValue({
      success: true,
      preferences: { home_budget_max: 500000 },
    });
    vi.mocked(preferencesApi.createOrUpdate).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useSyncAgentPreferencesFromClient(), { wrapper });

    await act(async () => {
      await result.current.syncFromClient("client-1", "Alex");
    });

    await waitFor(() => {
      expect(preferencesApi.getByUserId).toHaveBeenCalledWith("client-1");
      expect(preferencesApi.createOrUpdate).toHaveBeenCalled();
      expect(showSuccessToast).toHaveBeenCalled();
    });
  });

  it("shows error toast when loading client preferences fails", async () => {
    vi.mocked(preferencesApi.getByUserId).mockResolvedValue({
      success: false,
      error: "not found",
    });

    const { result } = renderHook(() => useSyncAgentPreferencesFromClient(), { wrapper });

    await act(async () => {
      await result.current.syncFromClient("client-1");
    });

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalled();
    });
  });
});
