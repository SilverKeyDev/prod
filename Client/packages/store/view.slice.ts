import { create } from "zustand";

import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

export type ViewState = {
  // Sidebar
  sidebarExpanded: boolean;
  openCategories: Record<string, boolean>;

  // Dropdown selections (opt-in via persistKey)
  dropdownSelections: Record<string, unknown>;

  // Personalization UI
  personalizationEditMode: boolean;
  personalizationActiveSection: string;

  // Sidebar actions
  setSidebarExpanded: (expanded: boolean) => void;
  setCategoryOpen: (category: string, isOpen: boolean) => void;
  toggleCategory: (category: string) => void;

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
  | "setCategoryOpen"
  | "toggleCategory"
  | "setDropdownSelection"
  | "clearDropdownSelection"
  | "setPersonalizationEditMode"
  | "setPersonalizationActiveSection"
  | "reset"
> => ({
  sidebarExpanded: false, // Default to closed for better mobile UX
  openCategories: {
    onboard: false,
    search: false,
    decide: false,
    negotiate: false,
    close: false,
  },
  dropdownSelections: {},
  personalizationEditMode: false,
  personalizationActiveSection: "demographics",
});

const baseCreator: import("zustand").StateCreator<ViewState> = (set) => ({
  ...initialState(),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setCategoryOpen: (category, isOpen) =>
    set((s) => ({
      openCategories: { ...s.openCategories, [category]: isOpen },
    })),
  toggleCategory: (category) =>
    set((s) => ({
      openCategories: {
        ...s.openCategories,
        [category]: !s.openCategories[category],
      },
    })),

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

  setPersonalizationEditMode: (isEdit) =>
    set({ personalizationEditMode: isEdit }),
  setPersonalizationActiveSection: (section) =>
    set({ personalizationActiveSection: section }),

  // placeholder; overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<ViewState>(baseCreator, (set) => ({
  ...initialState(),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setCategoryOpen: (category, isOpen) =>
    set((s) => ({
      openCategories: { ...s.openCategories, [category]: isOpen },
    })),
  toggleCategory: (category) =>
    set((s) => ({
      openCategories: {
        ...s.openCategories,
        [category]: !s.openCategories[category],
      },
    })),
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
  setPersonalizationEditMode: (isEdit) =>
    set({ personalizationEditMode: isEdit }),
  setPersonalizationActiveSection: (section) =>
    set({ personalizationActiveSection: section }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<ViewState>;

const withPersist = persistSafe<ViewState>(withReset, {
  name: "view-store",
  version: 1,
  storage: localStorage,
  partialize: (state: ViewState) => ({
    // Persist benign UI state across sessions
    sidebarExpanded: state.sidebarExpanded,
    openCategories: state.openCategories,
    dropdownSelections: state.dropdownSelections,
    personalizationEditMode: state.personalizationEditMode,
    personalizationActiveSection: state.personalizationActiveSection,
  }),
  migrate: (persisted: unknown) =>
    ({ ...initialState(), ...(persisted as object) }) as ViewState,
}) as unknown as import("zustand").StateCreator<ViewState>;

const withDev = withDevtools<ViewState>("view")(
  withPersist,
) as unknown as import("zustand").StateCreator<ViewState>;

export const useViewStore = create<ViewState>()(withDev);
