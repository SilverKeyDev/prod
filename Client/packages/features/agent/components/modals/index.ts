/**
 * Agent modals - re-export or define modal components here.
 * Kept for alias @/features/agent/modals -> components/modals.
 */
export { AgentSearchContent } from "../search/AgentSearchContent";
export type {
  AgentSearchContentHandle,
  AgentSearchContentProps,
} from "../search/AgentSearchContent.types";
export type { AgentSearchPanelProps } from "../search/AgentSearchPanel";
export { AgentSearchPanel } from "../search/AgentSearchPanel";
export { default as CalendarEventRequestModal } from "./calendarEventRequest/CalendarEventRequestModal";
export { default as ConnectionRequestsInbox } from "./inbox/ConnectionRequestsInbox";
export { default as AgentSearchModal } from "./search/AgentSearchModal";
export { default as ClientSearchModal } from "./search/ClientSearchModal";
export { default as SelectDocumentModal } from "./search/SelectDocumentModal";
export { default as SelectHomeModal } from "./search/SelectHomeModal";
export { default as SettingsModal } from "./settings/SettingsModal";
