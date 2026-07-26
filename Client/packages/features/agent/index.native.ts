/**
 * Native-only exports (tab + root stack screens). Do not import from web.
 *
 * Metro resolves `packages/features/agent` to this file on iOS/Android, so it *replaces*
 * `index.ts` rather than supplementing it. Every member native code imports from the barrel
 * must therefore be re-exported here — the platform-neutral ones below come from their own
 * modules (not from `./index`, which would resolve back to this file).
 */
export { AgentConnectBanner } from "./components/AgentConnectBanner";
export { AgentProfileScreenNative } from "./components/agentProfile/AgentProfileScreen.native";
export { ClientHubScreen } from "./components/clientHub/ClientHubScreen";
export { DashboardAgentTodaySection } from "./components/dashboard/DashboardAgentTodaySection";
export { MessagingScreenNative } from "./components/messaging/screen/MessagingScreen.native";
export { useAgentClients } from "./hooks/data/clients/useAgentClients";
export { useResumePendingAgentPublicConnect } from "./hooks/data/connections/useResumePendingAgentPublicConnect";
export {
  agentClientKindTranslationKey,
  pipelineStageTranslationKey,
} from "./utils/agentClientListLabels";
export { type AgentClientSortMode, sortAgentClients } from "./utils/agentClientListSort";
export {
  type AgentRelationshipSummary,
  listAgentRelationshipSummaries,
} from "./utils/agentRelationshipSummaries";
export { mapTodosToAgendaDTO } from "./utils/mapTodosToAgendaDTO";
