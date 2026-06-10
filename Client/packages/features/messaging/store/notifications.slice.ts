import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

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

  // All setters below are idempotent: when nothing changes they return the
  // current `state` reference so Zustand's `Object.is(nextState, state)` check
  // skips notifying subscribers. This prevents N store updates per polling tick
  // from cascading into N×subscribers re-renders (see useDataPollingHelpers and
  // useAgentChats which call these in tight per-conversation loops).
  setUnreadCount: (conversationId: string, count: number) =>
    set((state: NotificationState) => {
      const safe = Math.max(0, count);
      if (state.unreadByConversation[conversationId] === safe) return state;
      const newUnreadByConversation = {
        ...state.unreadByConversation,
        [conversationId]: safe,
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
    set((state: NotificationState) => {
      const safe = typeof count === "number" && !isNaN(count) && count >= 0 ? count : 0;
      if (state.unreadCount === safe && state.isLoaded) return state;
      return { unreadCount: safe, isLoaded: true };
    }),

  markConversationRead: (conversationId: string) =>
    set((state: NotificationState) => {
      const hadUnread = state.unreadByConversation[conversationId] !== undefined;
      if (!hadUnread) {
        // Already read; only refresh lastReadTimestamp.
        const now = Date.now();
        if (state.lastReadTimestamp[conversationId] === now) return state;
        return {
          lastReadTimestamp: {
            ...state.lastReadTimestamp,
            [conversationId]: now,
          },
        };
      }
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
    set((state: NotificationState) => {
      if (state.lastReadTimestamp[conversationId] === timestamp) return state;
      return {
        lastReadTimestamp: {
          ...state.lastReadTimestamp,
          [conversationId]: timestamp,
        },
      };
    }),

  updateLastSeenMessageTimestamp: (conversationId: string, timestamp: number) =>
    set((state: NotificationState) => {
      if (state.lastSeenMessageTimestamp[conversationId] === timestamp) return state;
      return {
        lastSeenMessageTimestamp: {
          ...state.lastSeenMessageTimestamp,
          [conversationId]: timestamp,
        },
      };
    }),

  setActiveConversationId: (conversationId: string | null) =>
    set((state: NotificationState) => {
      if (state.activeConversationId === conversationId) return state;
      return { activeConversationId: conversationId };
    }),

  resetNotifications: () => set(initialState()),

  // placeholder; replaced by withResettable
  reset: () => {},
});

// `withResettable` shallow-merges the initial state back when reset() is
// called, which would overwrite the live setter functions with stale ones.
// Reuse `baseCreator` (idempotent setters) here so reset() preserves the same
// behavior the rest of the app already depends on.
const withReset = withResettable<NotificationState>(
  baseCreator,
  baseCreator
) as unknown as import("zustand").StateCreator<NotificationState>;

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
