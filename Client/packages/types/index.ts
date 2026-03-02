/**
 * Shared types barrel. Re-exports from feature packages so that
 * "packages/types" resolves for Vite and TypeScript.
 */

export type { SavedHome } from "./savedHome";
export {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "packages/features/checklists/types/checklists";
export type { Document, DocumentCategory } from "packages/features/documents/types/documents";
export type { CompareReport, Report } from "packages/features/documents/types/reports";
export type { UserPreferences, UserProfile } from "packages/features/homeauth/types/index";
export type { Property } from "packages/features/search/types/property";
export type { SearchResult } from "packages/features/search/types/result";

/** Agent dashboard urgent alert (shape used by TodayPanel and agent utils) */
export type UrgentAlert = {
  id: string;
  type: string;
  message: string;
  client_id: string;
  deadline: string;
  severity: string;
  created_at: string;
};
