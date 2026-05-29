import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

export type DevAppPersonaState = {
  /** Set after admin toggles `users.is_agent` this session; drives reminder banner. */
  serverIdentityTouched: boolean;
  markServerIdentityTouched: () => void;
  clearServerIdentityTouched: () => void;
};

const baseCreator: import("zustand").StateCreator<DevAppPersonaState> = (set) => ({
  serverIdentityTouched: false,
  markServerIdentityTouched: () => set({ serverIdentityTouched: true }),
  clearServerIdentityTouched: () => set({ serverIdentityTouched: false }),
});

export const useDevAppPersonaStore = create<DevAppPersonaState>()(
  withDevtools<DevAppPersonaState>("dev-app-persona")(baseCreator)
);
