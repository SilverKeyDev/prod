import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

export type ViewState = {
  // Sidebar
  sidebarExpanded: boolean;

  // Dropdown selections (opt-in via persistKey)
  dropdownSelections: Record<string, unknown>;

  // Personalization UI
  personalizationEditMode: boolean;
  personalizationActiveSection: string;

  // Sidebar actions
  setSidebarExpanded: (expanded: boolean) => void;

  // Dropdown actions
  setDropdownSelection: (key: string, value: unknown) => void;
  clearDropdownSelection: (key: string) => void;

  // Personalization actions
  setPersonalizationEditMode: (isEdit: boolean) => void;
  setPersonalizationActiveSection: (section: string) => void;

  reset: () => void;
};

const initialState = (): Omit<
  ViewState,
  | "setSidebarExpanded"
  | "setDropdownSelection"
  | "clearDropdownSelection"
  | "setPersonalizationEditMode"
  | "setPersonalizationActiveSection"
  | "reset"
> => ({
  sidebarExpanded: false, // Default to closed for better mobile UX
  dropdownSelections: {},
  personalizationEditMode: false,
  personalizationActiveSection: "demographics",
});

const baseCreator: import("zustand").StateCreator<ViewState> = (set) => ({
  ...initialState(),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setDropdownSelection: (key, value) =>
    set((s) => ({
      dropdownSelections: { ...s.dropdownSelections, [key]: value },
    })),
  clearDropdownSelection: (key) =>
    set((s) => {
      const next = { ...s.dropdownSelections };
      delete next[key];
      return { dropdownSelections: next } as Partial<ViewState> as ViewState;
    }),

  setPersonalizationEditMode: (isEdit) => set({ personalizationEditMode: isEdit }),
  setPersonalizationActiveSection: (section) => set({ personalizationActiveSection: section }),

  // placeholder; overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<ViewState>(baseCreator, (set) => ({
  ...initialState(),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setDropdownSelection: (key, value) =>
    set((s) => ({
      dropdownSelections: { ...s.dropdownSelections, [key]: value },
    })),
  clearDropdownSelection: (key) =>
    set((s) => {
      const next = { ...s.dropdownSelections };
      delete next[key];
      return { dropdownSelections: next } as Partial<ViewState> as ViewState;
    }),
  setPersonalizationEditMode: (isEdit) => set({ personalizationEditMode: isEdit }),
  setPersonalizationActiveSection: (section) => set({ personalizationActiveSection: section }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<ViewState>;

const withPersist = persistSafe<ViewState>(withReset, {
  name: "view-store",
  version: 1,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: ViewState) => ({
    // Persist benign UI state across sessions
    sidebarExpanded: state.sidebarExpanded,
    dropdownSelections: state.dropdownSelections,
    personalizationEditMode: state.personalizationEditMode,
    personalizationActiveSection: state.personalizationActiveSection,
  }),
  migrate: (persisted: unknown) => ({ ...initialState(), ...(persisted as object) }) as ViewState,
}) as unknown as import("zustand").StateCreator<ViewState>;

const withDev = withDevtools<ViewState>("view")(
  withPersist
) as unknown as import("zustand").StateCreator<ViewState>;

export const useViewStore = create<ViewState>()(withDev);
