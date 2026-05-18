import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

/** Dev-only persona labels; broker uses the agent shell until a dedicated broker workspace exists. */
export type AppDevPersona = "agent" | "broker" | "buyer" | "seller";

export type DevAppPersonaState = {
  /** Session-only: set after a successful persona mutation so the banner can appear. */
  persona: AppDevPersona | null;
  setActivePersona: (persona: AppDevPersona | null) => void;
};

const baseCreator: import("zustand").StateCreator<DevAppPersonaState> = (set) => ({
  persona: null,
  setActivePersona: (persona) => set({ persona }),
});

export const useDevAppPersonaStore = create<DevAppPersonaState>()(
  withDevtools<DevAppPersonaState>("dev-app-persona")(baseCreator)
);
