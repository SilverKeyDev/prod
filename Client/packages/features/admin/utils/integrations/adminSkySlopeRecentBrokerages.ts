import { getFromSessionStorage, setToSessionStorage } from "packages/utils/core/storage/storage";

export const RECENT_BROKERAGE_IDS_STORAGE_KEY = "sk_admin_recent_brokerage_ids";
const MAX_RECENT = 12;

function readRecent(): string[] {
  const parsed = getFromSessionStorage<string[]>(RECENT_BROKERAGE_IDS_STORAGE_KEY, {
    defaultValue: [],
  });
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

function writeRecent(ids: string[]): void {
  setToSessionStorage(RECENT_BROKERAGE_IDS_STORAGE_KEY, ids.slice(0, MAX_RECENT));
}

export function listRecentBrokerageIds(): string[] {
  return readRecent();
}

export function rememberRecentBrokerageId(brokerageId: string): void {
  const trimmed = brokerageId.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readRecent().filter((id) => id !== trimmed)];
  writeRecent(next);
}

export function filterBrokerageIds(ids: readonly string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...ids];
  return ids.filter((id) => id.toLowerCase().includes(needle));
}
