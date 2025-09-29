import { create } from "zustand";

import { withDevtools } from "./middleware/devtools";
import { persistSafe } from "./middleware/persistSafe";
import { withResettable } from "./middleware/resettable";

type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

export type UIState = {
  // Global UI flags
  isAnyModalOpen: boolean;
  isAnyDrawerOpen: boolean;
  isGlobalLoading: boolean;
  isCarouselCollapsed: boolean;
  showPropertyModals: boolean;
  activeToastId: string | null;
  toastQueue: ToastItem[];

  // Actions
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;

  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  setGlobalLoading: (loading: boolean) => void;
  setCarouselCollapsed: (collapsed: boolean) => void;
  setShowPropertyModals: (show: boolean) => void;

  enqueueToast: (toast: Omit<ToastItem, "id"> & { id?: string }) => void;
  dequeueToast: (id?: string) => void;
  clearToasts: () => void;

  reset: () => void;
};

const initialState = (): Pick<
  UIState,
  | "isAnyModalOpen"
  | "isAnyDrawerOpen"
  | "isGlobalLoading"
  | "isCarouselCollapsed"
  | "showPropertyModals"
  | "activeToastId"
  | "toastQueue"
> => ({
  isAnyModalOpen: false,
  isAnyDrawerOpen: false,
  isGlobalLoading: false,
  isCarouselCollapsed: false,
  showPropertyModals: false,
  activeToastId: null,
  toastQueue: [],
});

const baseCreator: import("zustand").StateCreator<UIState> = (set) => ({
  ...initialState(),

  openModal: () => set({ isAnyModalOpen: true }),
  closeModal: () => set({ isAnyModalOpen: false }),
  toggleModal: () =>
    set((s: UIState) => ({ isAnyModalOpen: !s.isAnyModalOpen })),

  openDrawer: () => set({ isAnyDrawerOpen: true }),
  closeDrawer: () => set({ isAnyDrawerOpen: false }),
  toggleDrawer: () =>
    set((s: UIState) => ({ isAnyDrawerOpen: !s.isAnyDrawerOpen })),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  setCarouselCollapsed: (collapsed) => set({ isCarouselCollapsed: collapsed }),
  setShowPropertyModals: (show) => set({ showPropertyModals: show }),

  enqueueToast: (toast) =>
    set((state: UIState) => {
      const id =
        toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextQueue = [
        ...state.toastQueue,
        { id, message: toast.message, type: toast.type },
      ];
      return {
        toastQueue: nextQueue,
        activeToastId: state.activeToastId ?? id,
      } as Partial<UIState> as UIState;
    }),
  dequeueToast: (id) =>
    set((state: UIState) => {
      const targetId = id ?? state.activeToastId ?? state.toastQueue[0]?.id;
      const nextQueue = state.toastQueue.filter((t) => t.id !== targetId);
      const nextActive = nextQueue[0]?.id ?? null;
      return {
        toastQueue: nextQueue,
        activeToastId: nextActive,
      } as Partial<UIState> as UIState;
    }),
  clearToasts: () => set({ toastQueue: [], activeToastId: null }),

  // placeholder; replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<UIState>(baseCreator, (set) => ({
  ...initialState(),
  openModal: () => set({ isAnyModalOpen: true }),
  closeModal: () => set({ isAnyModalOpen: false }),
  toggleModal: () =>
    set((s: UIState) => ({ isAnyModalOpen: !s.isAnyModalOpen })),
  openDrawer: () => set({ isAnyDrawerOpen: true }),
  closeDrawer: () => set({ isAnyDrawerOpen: false }),
  toggleDrawer: () =>
    set((s: UIState) => ({ isAnyDrawerOpen: !s.isAnyDrawerOpen })),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  setCarouselCollapsed: (collapsed) => set({ isCarouselCollapsed: collapsed }),
  setShowPropertyModals: (show) => set({ showPropertyModals: show }),
  enqueueToast: (toast) =>
    set((state: UIState) => {
      const id =
        toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextQueue = [
        ...state.toastQueue,
        { id, message: toast.message, type: toast.type },
      ];
      return {
        toastQueue: nextQueue,
        activeToastId: state.activeToastId ?? id,
      } as Partial<UIState> as UIState;
    }),
  dequeueToast: (id) =>
    set((state: UIState) => {
      const targetId = id ?? state.activeToastId ?? state.toastQueue[0]?.id;
      const nextQueue = state.toastQueue.filter((t) => t.id !== targetId);
      const nextActive = nextQueue[0]?.id ?? null;
      return {
        toastQueue: nextQueue,
        activeToastId: nextActive,
      } as Partial<UIState> as UIState;
    }),
  clearToasts: () => set({ toastQueue: [], activeToastId: null }),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<UIState>;

const withPersist = persistSafe<UIState>(withReset, {
  name: "ui-store",
  version: 1,
  storage: localStorage,
  partialize: (state: UIState) => ({
    // Persist only safe UI prefs; avoid transient flags
    toastQueue: state.toastQueue,
    isCarouselCollapsed: state.isCarouselCollapsed,
  }),
  migrate: (persisted: unknown): UIState => {
    const base = { ...initialState() } as UIState;
    if (!persisted) {
      return {
        ...base,
        openModal: () => {},
        closeModal: () => {},
        toggleModal: () => {},
        openDrawer: () => {},
        closeDrawer: () => {},
        toggleDrawer: () => {},
        setGlobalLoading: () => {},
        setCarouselCollapsed: () => {},
        setShowPropertyModals: () => {},
        enqueueToast: () => {},
        dequeueToast: () => {},
        clearToasts: () => {},
        reset: () => {},
      } as unknown as UIState;
    }
    const pd = persisted as Record<string, unknown>;
    return {
      ...base,
      toastQueue: (pd.toastQueue as ToastItem[]) ?? [],
      isCarouselCollapsed: (pd.isCarouselCollapsed as boolean) ?? false,
      openModal: () => {},
      closeModal: () => {},
      toggleModal: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
      toggleDrawer: () => {},
      setGlobalLoading: () => {},
      setCarouselCollapsed: () => {},
      setShowPropertyModals: () => {},
      enqueueToast: () => {},
      dequeueToast: () => {},
      clearToasts: () => {},
      reset: () => {},
    } as unknown as UIState;
  },
}) as unknown as import("zustand").StateCreator<UIState>;

const withDev = withDevtools<UIState>("ui")(
  withPersist,
) as unknown as import("zustand").StateCreator<UIState>;

export const useUIStore = create<UIState>()(withDev);
