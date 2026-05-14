/**
 * Messaging feature barrel file - centralized exports for messaging functionality
 */

// API
export * from "./api/chatbot";

// Types
export * from "./types/chat";
export * from "./types/messages";

// Components
export * from "./components/AgentMessaging";
export * from "./components/ClientMessaging";

// Hooks
export * from "./hooks/data/messaging";
export * from "./hooks/data/useAgentChats";
export { useMessagingComposerStoreIntegration } from "./hooks/store/useMessagingComposerStoreIntegration";
export * from "./hooks/ui";

// Store (also re-exported from packages/store)
export * from "./store";

// Utils
export * from "./utils";
