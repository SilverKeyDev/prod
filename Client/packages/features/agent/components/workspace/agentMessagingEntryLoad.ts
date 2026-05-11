/**
 * Heavy agent messaging UI (AgentMessaging) — split from AgentDashboard so the
 * dashboard route chunk stays small; prefetch shares this Promise with React.lazy().
 */
let agentMessagingUIModulePromise: Promise<
  typeof import("packages/features/messaging/components/AgentMessaging/AgentMessaging")
> | null = null;

export function loadAgentMessagingUIModule(): Promise<
  typeof import("packages/features/messaging/components/AgentMessaging/AgentMessaging")
> {
  agentMessagingUIModulePromise ??=
    import("packages/features/messaging/components/AgentMessaging/AgentMessaging");
  return agentMessagingUIModulePromise;
}
