export { AgentConnectBanner } from "./components/AgentConnectBanner";
export { AgentDiscoveryView } from "./components/agentDiscovery/AgentDiscoveryView";
export type { AgentDiscoveryViewProps } from "./components/agentDiscovery/agentDiscoveryView.types";
export { default as AgentFeature } from "./components/AgentFeature";
export { default as ClientList } from "./components/clientList/ClientList";
export { DashboardAgentTodaySection } from "./components/dashboard/DashboardAgentTodaySection";
export { default as AgentMessaging } from "./components/messaging/AgentMessaging";
export { default as ClientMessaging } from "./components/messaging/ClientMessaging";
export { default as AttachmentMenu } from "./components/messaging/menus/AttachmentMenu";
export type {
  MessageRole,
  MessagingConfig,
  MessagingMode,
} from "./components/messaging/screen/messagingConfig";
export {
  AGENT_MESSAGING_CONFIG,
  CLIENT_MESSAGING_CONFIG,
  getMessagingConfig,
} from "./components/messaging/screen/messagingConfig";
export * from "./components/modals";
export { PublicAgentProfileConnect } from "./components/PublicAgentProfileConnect";
export { PublicAgentSearchGate } from "./components/PublicAgentSearchGate";
export { default as AgentDashboard } from "./components/workspace/AgentDashboard";
export { useEventRequests } from "./hooks/data/calendar/useEventRequests";
export { useAgentClients } from "./hooks/data/clients/useAgentClients";
export { useResumePendingAgentPublicConnect } from "./hooks/data/connections/useResumePendingAgentPublicConnect";
export { useAgentSyncPreferencesWhenClientSelected } from "./hooks/data/search/useAgentSyncPreferencesWhenClientSelected";
export {
  type SyncFromClientOptions,
  useSyncAgentPreferencesFromClient,
  type UseSyncAgentPreferencesFromClientReturn,
} from "./hooks/data/search/useSyncAgentPreferencesFromClient";
export { useAgentAutoSelectClient } from "./hooks/ui/useAgentAutoSelectClient";
export { type AgentDashboardState, useAgentDashboardStore } from "./store";
export { AGENT_TRANSLATIONS } from "./types/translations";
export {
  agentClientKindTranslationKey,
  pipelineStageTranslationKey,
} from "./utils/agentClientListLabels";
export { type AgentClientSortMode, sortAgentClients } from "./utils/agentClientListSort";
export type { ClientDealInfo } from "./utils/agentDashboard";
export {
  type AgentRelationshipSummary,
  listAgentRelationshipSummaries,
} from "./utils/agentRelationshipSummaries";
export { mapTodosToAgendaDTO } from "./utils/mapTodosToAgendaDTO";
