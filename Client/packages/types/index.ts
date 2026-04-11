/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * Shared types barrel - re-exports from feature packages and generated schema.
 */

export type { GoogleCalendar, GoogleEvent } from "./googleCalendar";
export type { PropertyDetailsStreamProperty } from "./propertyDetailsStream";
export type { SavedHome, SavedHomeRecord } from "./savedHome";
export {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "packages/features/checklists/types/checklists";
export type {
  DocumentCategory,
  WorkflowDocument,
  WorkflowDocumentRecord,
} from "packages/features/documents/types/documents";
export type {
  CompareReport,
  Report,
} from "packages/features/documents/types/reports";
export type {
  UserPreferences,
  UserProfile,
} from "packages/features/homeauth/types/index";
export type { Property } from "packages/features/search/types/property";
export type { SearchResult } from "packages/features/search/types/result";
