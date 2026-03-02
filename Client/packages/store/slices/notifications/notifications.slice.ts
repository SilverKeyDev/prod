import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

export type NotificationState = {
  // Unread counts
  unreadCount: number;
  unreadByConversation: Record<string, number>;
  lastReadTimestamp: Record<string, number>;

  // Last seen message timestamps per conversation
  lastSeenMessageTimestamp: Record<string, number>;

  // Active conversation ID (currently being viewed)
  activeConversationId: string | null;

  // Loading state - true when data has been loaded from API
  isLoaded: boolean;

  // Actions
  setUnreadCount: (conversationId: string, count: number) => void;
  setTotalUnreadCount: (count: number) => void;
  markConversationRead: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;
  updateLastReadTimestamp: (conversationId: string, timestamp: number) => void;
  updateLastSeenMessageTimestamp: (conversationId: string, timestamp: number) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  resetNotifications: () => void;
  reset: () => void;
};

const initialState = (): Pick<
  NotificationState,
  | "unreadCount"
  | "unreadByConversation"
  | "lastReadTimestamp"
  | "lastSeenMessageTimestamp"
  | "activeConversationId"
  | "isLoaded"
> => ({
  unreadCount: 0,
  unreadByConversation: {},
  lastReadTimestamp: {},
  lastSeenMessageTimestamp: {},
  activeConversationId: null,
  isLoaded: false,
});

const baseCreator: import("zustand").StateCreator<NotificationState> = (set) => ({
  ...initialState(),

  setUnreadCount: (conversationId: string, count: number) =>
    set((state: NotificationState) => {
      const newUnreadByConversation = {
        ...state.unreadByConversation,
        [conversationId]: Math.max(0, count),
      };
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
      };
    }),

  setTotalUnreadCount: (count: number) =>
    set({
      unreadCount: typeof count === "number" && !isNaN(count) && count >= 0 ? count : 0,
      isLoaded: true, // Mark as loaded when we receive data from API
    }),

  markConversationRead: (conversationId: string) =>
    set((state: NotificationState) => {
      const newUnreadByConversation = {
        ...state.unreadByConversation,
      };
      delete newUnreadByConversation[conversationId];
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
        lastReadTimestamp: {
          ...state.lastReadTimestamp,
          [conversationId]: Date.now(),
        },
      };
    }),

  incrementUnreadCount: (conversationId: string) =>
    set((state: NotificationState) => {
      const currentCount = state.unreadByConversation[conversationId] ?? 0;
      const newUnreadByConversation = {
        ...state.unreadByConversation,
        [conversationId]: currentCount + 1,
      };
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
      };
    }),

  updateLastReadTimestamp: (conversationId: string, timestamp: number) =>
    set((state: NotificationState) => ({
      lastReadTimestamp: {
        ...state.lastReadTimestamp,
        [conversationId]: timestamp,
      },
    })),

  updateLastSeenMessageTimestamp: (conversationId: string, timestamp: number) =>
    set((state: NotificationState) => ({
      lastSeenMessageTimestamp: {
        ...state.lastSeenMessageTimestamp,
        [conversationId]: timestamp,
      },
    })),

  setActiveConversationId: (conversationId: string | null) =>
    set((state: NotificationState) => {
      // Mark previous conversation as read when switching away
      if (state.activeConversationId && state.activeConversationId !== conversationId) {
        // Don't mark as read here - let the component handle it when loading messages
      }
      return { activeConversationId: conversationId };
    }),

  resetNotifications: () => set(initialState()),

  // placeholder; replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<NotificationState>(baseCreator, (set) => ({
  ...initialState(),
  setUnreadCount: (conversationId: string, count: number) =>
    set((state: NotificationState) => {
      const newUnreadByConversation = {
        ...state.unreadByConversation,
        [conversationId]: Math.max(0, count),
      };
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
      };
    }),
  setTotalUnreadCount: (count: number) =>
    set({
      unreadCount: Math.max(0, count),
      isLoaded: true, // Mark as loaded when we receive data from API
    }),
  markConversationRead: (conversationId: string) =>
    set((state: NotificationState) => {
      const newUnreadByConversation = {
        ...state.unreadByConversation,
      };
      delete newUnreadByConversation[conversationId];
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
        lastReadTimestamp: {
          ...state.lastReadTimestamp,
          [conversationId]: Date.now(),
        },
      };
    }),
  incrementUnreadCount: (conversationId: string) =>
    set((state: NotificationState) => {
      const currentCount = state.unreadByConversation[conversationId] ?? 0;
      const newUnreadByConversation = {
        ...state.unreadByConversation,
        [conversationId]: currentCount + 1,
      };
      const newUnreadCount = Object.values(newUnreadByConversation).reduce(
        (sum, val) => sum + val,
        0
      );
      return {
        unreadByConversation: newUnreadByConversation,
        unreadCount: newUnreadCount,
      };
    }),
  updateLastReadTimestamp: (conversationId: string, timestamp: number) =>
    set((state: NotificationState) => ({
      lastReadTimestamp: {
        ...state.lastReadTimestamp,
        [conversationId]: timestamp,
      },
    })),
  updateLastSeenMessageTimestamp: (conversationId: string, timestamp: number) =>
    set((state: NotificationState) => ({
      lastSeenMessageTimestamp: {
        ...state.lastSeenMessageTimestamp,
        [conversationId]: timestamp,
      },
    })),
  setActiveConversationId: (conversationId: string | null) =>
    set((state: NotificationState) => {
      // Mark previous conversation as read when switching away
      if (state.activeConversationId && state.activeConversationId !== conversationId) {
        // Don't mark as read here - let the component handle it when loading messages
      }
      return { activeConversationId: conversationId };
    }),
  resetNotifications: () => set(initialState()),
  reset: () => {},
})) as unknown as import("zustand").StateCreator<NotificationState>;

const withPersist = persistSafe<NotificationState>(withReset, {
  name: "notifications-store",
  version: 1,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: NotificationState) => ({
    // Persist unread counts and timestamps
    // Note: activeConversationId is NOT persisted as it's transient state
    unreadByConversation: state.unreadByConversation,
    lastReadTimestamp: state.lastReadTimestamp,
    lastSeenMessageTimestamp: state.lastSeenMessageTimestamp,
  }),
  migrate: (persisted: unknown): NotificationState => {
    const base = { ...initialState() } as NotificationState;
    if (!persisted) {
      return {
        ...base,
        setUnreadCount: () => {},
        setTotalUnreadCount: () => {},
        markConversationRead: () => {},
        incrementUnreadCount: () => {},
        updateLastReadTimestamp: () => {},
        updateLastSeenMessageTimestamp: () => {},
        setActiveConversationId: () => {},
        resetNotifications: () => {},
        reset: () => {},
      } as unknown as NotificationState;
    }
    const pd = persisted as Record<string, unknown>;
    const unreadByConversation = (pd.unreadByConversation as Record<string, number>) ?? {};
    // Don't use persisted unreadCount - reset to 0 and wait for API to load
    // This prevents showing stale data on page reload
    return {
      ...base,
      unreadByConversation,
      unreadCount: 0, // Always start at 0, wait for API to load
      isLoaded: false, // Not loaded until API responds
      lastReadTimestamp: (pd.lastReadTimestamp as Record<string, number>) ?? {},
      lastSeenMessageTimestamp: (pd.lastSeenMessageTimestamp as Record<string, number>) ?? {},
      // activeConversationId is always null on load (transient state)
      activeConversationId: null,
      setUnreadCount: () => {},
      setTotalUnreadCount: () => {},
      markConversationRead: () => {},
      incrementUnreadCount: () => {},
      updateLastReadTimestamp: () => {},
      updateLastSeenMessageTimestamp: () => {},
      setActiveConversationId: () => {},
      resetNotifications: () => {},
      reset: () => {},
    } as unknown as NotificationState;
  },
}) as unknown as import("zustand").StateCreator<NotificationState>;

const withDev = withDevtools<NotificationState>("notifications")(
  withPersist
) as unknown as import("zustand").StateCreator<NotificationState>;

export const useNotificationStore = create<NotificationState>()(withDev);
