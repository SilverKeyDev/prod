/**
 * Shared Promise per agent shell lazy branch so prefetch + AgentFeature React.lazy()
 * reuse the same import().
 */
let agentDashboardModulePromise: Promise<typeof import("../workspace/AgentDashboard")> | null =
  null;
let clientMessagingModulePromise: Promise<typeof import("../messaging/ClientMessaging")> | null =
  null;
let brokerageMessagingModulePromise: Promise<
  typeof import("packages/features/messaging/components/BrokerageMessaging/BrokerageMessaging")
> | null = null;

export function loadAgentDashboardModule(): Promise<typeof import("../workspace/AgentDashboard")> {
  agentDashboardModulePromise ??= import("../workspace/AgentDashboard");
  return agentDashboardModulePromise;
}

let workspaceMessagingShellModulePromise: Promise<
  typeof import("packages/features/messaging/components/workspace/WorkspaceMessagingShell")
> | null = null;

export function loadClientMessagingModule(): Promise<
  typeof import("../messaging/ClientMessaging")
> {
  clientMessagingModulePromise ??= import("../messaging/ClientMessaging");
  return clientMessagingModulePromise;
}

export function loadBrokerageMessagingModule(): Promise<
  typeof import("packages/features/messaging/components/BrokerageMessaging/BrokerageMessaging")
> {
  brokerageMessagingModulePromise ??=
    import("packages/features/messaging/components/BrokerageMessaging/BrokerageMessaging");
  return brokerageMessagingModulePromise;
}

export function loadWorkspaceMessagingShellModule(): Promise<
  typeof import("packages/features/messaging/components/workspace/WorkspaceMessagingShell")
> {
  workspaceMessagingShellModulePromise ??=
    import("packages/features/messaging/components/workspace/WorkspaceMessagingShell");
  return workspaceMessagingShellModulePromise;
}
