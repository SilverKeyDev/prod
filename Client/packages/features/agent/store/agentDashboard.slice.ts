import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

/**
 * Shared agent context for Search / Saved / mobile search: which client (if any) the agent is viewing.
 * null = agent's own data ("Me").
 */
export type AgentDashboardState = {
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  reset: () => void;
};

const initialState = (): Pick<AgentDashboardState, "selectedClientId"> => ({
  selectedClientId: null,
});

const baseCreator: import("zustand").StateCreator<AgentDashboardState> = (set) => ({
  ...initialState(),

  setSelectedClientId: (id) => set({ selectedClientId: id }),

  reset: () => set(initialState()),
});

const withDev = withDevtools<AgentDashboardState>("agentDashboard")(baseCreator);

export const useAgentDashboardStore = create<AgentDashboardState>()(withDev);
