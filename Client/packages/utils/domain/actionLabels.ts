/** Canonical English action copy. Values back `TRANSLATIONS` maps; UI should resolve via `t("key")` where localization is wired. */

export const ACTION_LABELS = {
  SHARE: "Share",
  SAVE: "Save",
  REMOVE: "Remove",
  SEND: "Send",
  SEND_REQUEST: "Send Request",
  SEND_FOR_SIGNATURE: "Send for Signature",
  SEND_AGREEMENT: "Send Agreement",
  SENDING_PROGRESS: "Sending...",
  VIEW: "View",
  VIEW_DETAILS: "View details",
  OPEN: "Open",
  VIEW_REPORT: "View report",
  SHARE_IN_MESSAGES: "Share in Messages",
} as const;

/** PDF / modal chrome (titles and aria aligned with documents translations). */
export const DOCUMENT_ACTION_LABELS = {
  SHARE_REPORT: "Share report",
  OPEN_PDF_NEW_TAB: "Open PDF in New Tab",
  DOWNLOAD_PDF: "Download PDF",
} as const;

/** Accessibility defaults for overlay controls (heart save). */
export const ARIA_LABELS = {
  HEART_SAVE: "Save",
  HEART_REMOVE_SAVED_HOME: "Remove from saved homes",
} as const;

/** Vertical feed / reels rail (visible captions). Share/save/remove match global action verbs. */
export const FEED_ACTION_LABELS = {
  LIKE: "Like",
  COMMENT: "Comment",
  SHARE: ACTION_LABELS.SHARE,
  SAVE: ACTION_LABELS.SAVE,
  REMOVE: ACTION_LABELS.REMOVE,
  MORE: "More",
  MUTE: "Mute",
  UNMUTE: "Unmute",
} as const;
