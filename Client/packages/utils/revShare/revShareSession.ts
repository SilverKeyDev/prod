import { getSessionStorage } from "packages/utils/storage/platformStorage";

const REV_SHARE_SESSION_KEY = "rev_share_session_id";

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Persisted per browser tab session for rev-share click dedupe. */
export function getOrCreateRevShareSessionId(): string {
  const storage = getSessionStorage();
  const existing = storage.getItem(REV_SHARE_SESSION_KEY);
  if (existing?.trim()) {
    return existing.trim();
  }
  const sessionId = generateSessionId();
  storage.setItem(REV_SHARE_SESSION_KEY, sessionId);
  return sessionId;
}
