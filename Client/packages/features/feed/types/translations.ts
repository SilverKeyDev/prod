import { FEED_ACTION_LABELS } from "packages/utils/product/domain/actionLabels";

/** Feed / reels overlay action labels (wired to LocalizationContext). */
export const FEED_TRANSLATIONS: Record<string, string> = {
  "feed.like": FEED_ACTION_LABELS.LIKE,
  "feed.comment": FEED_ACTION_LABELS.COMMENT,
  "feed.share": FEED_ACTION_LABELS.SHARE,
  "feed.save": FEED_ACTION_LABELS.SAVE,
  "feed.remove_saved": FEED_ACTION_LABELS.REMOVE,
  "feed.more": FEED_ACTION_LABELS.MORE,
  "feed.mute": FEED_ACTION_LABELS.MUTE,
  "feed.unmute": FEED_ACTION_LABELS.UNMUTE,
};
