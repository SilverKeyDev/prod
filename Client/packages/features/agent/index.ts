export { default as AgentDashboard } from "./components/AgentDashboard";
export { default as AgentFeature } from "./components/AgentFeature";
export { default as AgentMessaging } from "./components/AgentMessaging";
export { default as AttachmentMenu } from "./components/AttachmentMenu";
export { default as ClientMessaging } from "./components/ClientMessaging";
export type { MessageRole, MessagingConfig, MessagingMode } from "./components/messagingConfig";
export {
  AGENT_MESSAGING_CONFIG,
  CLIENT_MESSAGING_CONFIG,
  getMessagingConfig,
} from "./components/messagingConfig";
export * from "./components/modals";
export { useEventRequests } from "./hooks/data/useEventRequests";
export { AGENT_TRANSLATIONS } from "./types/translations";
