/**
 * Messaging feature barrel file - centralized exports for messaging functionality
 *
 * Workspace-scoped messaging lives under components/workspace/, hooks/data/workspace/,
 * and utils/workspace/ (persona registry + surface routing) — intentional subpaths, not
 * a separate feature package.
 */

// API
export * from "./api/chatbot";
export * from "./api/workspaceConversations";

// Types
export * from "./types/chat";
export * from "./types/messages";
export type {
  WorkspaceConversationKind,
  WorkspaceMessagingPersonaConfig,
  WorkspaceMessagingPersonaId,
  WorkspaceMessagingSidebarLayout,
} from "./types/workspace/personas";

// Components
export * from "./components/AgentMessaging";
export * from "./components/BrokerageMessaging";
export { default as AgreementEventCard } from "./components/cards/AgreementEventCard";
export * from "./components/ClientMessaging";
export { default as WorkspaceMessagingShell } from "./components/workspace/WorkspaceMessagingShell";

// Hooks
export * from "./hooks/data/messaging";
export * from "./hooks/data/useAgentChats";
export * from "./hooks/data/workspace";
export { useMessagingComposerStoreIntegration } from "./hooks/store/useMessagingComposerStoreIntegration";
export * from "./hooks/ui";

// Store (also re-exported from packages/store)
export * from "./store";

// Utils
export * from "./utils";
export { getMessagingSurfaceForWorkspace } from "./utils/workspace/getMessagingSurfaceForWorkspace";
export {
  allWorkspaceMessagingPersonas,
  getWorkspaceMessagingPersona,
} from "./utils/workspace/personasRegistry";
