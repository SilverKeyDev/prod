import { create } from "zustand";

import { getSessionStorage } from "packages/utils/storage/platformStorage";

const USER_UNMUTED_KEY = "feed_user_has_unmuted";

function getStoredUserHasUnmuted(): boolean {
  try {
    return getSessionStorage().getItem(USER_UNMUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export type FeedState = {
  autoplayEnabled: boolean;
  userHasUnmuted: boolean;
  setUserHasUnmuted: (unmuted: boolean) => void;
  /** Spec alignment: setMuted(true) = mute, setMuted(false) = unmute */
  setMuted: (muted: boolean) => void;
  /** User manually paused the active reel; cleared on scroll so next reel autoplays */
  userPaused: boolean;
  setUserPaused: (paused: boolean) => void;
};

export const useFeedStore = create<FeedState>()((set) => ({
  autoplayEnabled: true,
  userHasUnmuted: getStoredUserHasUnmuted(),
  userPaused: false,
  setUserPaused: (paused) => set({ userPaused: paused }),
  setUserHasUnmuted: (unmuted) => {
    try {
      getSessionStorage().setItem(USER_UNMUTED_KEY, String(unmuted));
    } catch {
      /* ignore */
    }
    set({ userHasUnmuted: unmuted });
  },
  setMuted: (muted) => {
    const unmuted = !muted;
    try {
      getSessionStorage().setItem(USER_UNMUTED_KEY, String(unmuted));
    } catch {
      /* ignore */
    }
    set({ userHasUnmuted: unmuted });
  },
}));
