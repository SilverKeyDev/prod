import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgentClient } from "packages/api";

import { useAgentDashboardMockData } from "./useAgentDashboardMockData";

const mockClient: AgentClient = {
  id: "client-1",
  name: "Taylor",
  email: "taylor@example.com",
};

vi.mock("@/features/agent/utils/agentDashboard", () => ({
  enhanceClientWithDealInfo: vi.fn((client: AgentClient) => ({
    clientId: client.id,
    dealStage: "search",
  })),
  generateMockAlerts: vi.fn(() => [{ id: "alert-1", message: "Test alert" }]),
  generateMockClientGoals: vi.fn(() => ({ primary: "Buy home" })),
  generateMockDecisionLog: vi.fn(() => []),
  generateMockFinancialSnapshot: vi.fn(() => ({})),
  generateMockNotes: vi.fn(() => []),
  generateMockTimelineEvents: vi.fn(() => []),
}));

import {
  enhanceClientWithDealInfo,
  generateMockAlerts,
} from "@/features/agent/utils/agentDashboard";

describe("useAgentDashboardMockData", () => {
  it("delegates enhanceClientWithDealInfo to agent dashboard utils", () => {
    const { result } = renderHook(() => useAgentDashboardMockData());

    const dealInfo = result.current.enhanceClientWithDealInfo(mockClient, "offer");
    expect(enhanceClientWithDealInfo).toHaveBeenCalledWith(mockClient, "offer");
    expect(dealInfo).toEqual({ clientId: "client-1", dealStage: "search" });
  });

  it("delegates generateMockAlerts to agent dashboard utils", () => {
    const { result } = renderHook(() => useAgentDashboardMockData());

    const alerts = result.current.generateMockAlerts([mockClient], "client-1");
    expect(generateMockAlerts).toHaveBeenCalledWith([mockClient], "client-1");
    expect(alerts).toEqual([{ id: "alert-1", message: "Test alert" }]);
  });
});
