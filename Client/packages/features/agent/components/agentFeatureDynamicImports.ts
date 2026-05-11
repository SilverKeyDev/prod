/**
 * Shared Promise per agent shell lazy branch so prefetch + AgentFeature React.lazy()
 * reuse the same import().
 */
let agentDashboardModulePromise: Promise<typeof import("./workspace/AgentDashboard")> | null = null;
let clientMessagingModulePromise: Promise<typeof import("./messaging/ClientMessaging")> | null =
  null;

export function loadAgentDashboardModule(): Promise<typeof import("./workspace/AgentDashboard")> {
  agentDashboardModulePromise ??= import("./workspace/AgentDashboard");
  return agentDashboardModulePromise;
}

export function loadClientMessagingModule(): Promise<typeof import("./messaging/ClientMessaging")> {
  clientMessagingModulePromise ??= import("./messaging/ClientMessaging");
  return clientMessagingModulePromise;
}
