import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

export type AgendaCompletionState = {
  completedEventKeys: Record<string, true>;
  toggleAgendaEventComplete: (key: string) => void;
  isAgendaEventComplete: (key: string) => boolean;
  reset: () => void;
};

const initialState = (): Pick<AgendaCompletionState, "completedEventKeys"> => ({
  completedEventKeys: {},
});

const baseCreator: import("zustand").StateCreator<AgendaCompletionState> = (set, get) => ({
  ...initialState(),

  toggleAgendaEventComplete: (key) =>
    set((s) => {
      const next = { ...s.completedEventKeys };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { completedEventKeys: next };
    }),

  isAgendaEventComplete: (key) => Boolean(get().completedEventKeys[key]),

  reset: () => {},
});

const withReset = withResettable<AgendaCompletionState>(baseCreator, (set, get) => ({
  ...initialState(),
  toggleAgendaEventComplete: (key) =>
    set((s) => {
      const next = { ...s.completedEventKeys };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { completedEventKeys: next };
    }),
  isAgendaEventComplete: (key) => Boolean(get().completedEventKeys[key]),
  reset: () => {},
}));

const withPersist = persistSafe<AgendaCompletionState>(withReset, {
  name: "agenda-completion-store",
  version: 1,
  storage: getSessionStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: AgendaCompletionState) => ({
    completedEventKeys: state.completedEventKeys,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as AgendaCompletionState,
}) as unknown as import("zustand").StateCreator<AgendaCompletionState>;

const withDev = withDevtools<AgendaCompletionState>("agendaCompletion")(
  withPersist
) as unknown as import("zustand").StateCreator<AgendaCompletionState>;

export const useAgendaCompletionStore = create<AgendaCompletionState>()(withDev);
