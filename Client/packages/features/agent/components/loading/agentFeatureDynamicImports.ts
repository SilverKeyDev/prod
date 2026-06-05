/**
 * Shared Promise per agent shell lazy branch so prefetch + AgentFeature React.lazy()
 * reuse the same import().
 */
let agentDashboardModulePromise: Promise<typeof import("../workspace/AgentDashboard")> | null =
  null;
let clientMessagingModulePromise: Promise<typeof import("../messaging/ClientMessaging")> | null =
  null;

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

export function loadWorkspaceMessagingShellModule(): Promise<
  typeof import("packages/features/messaging/components/workspace/WorkspaceMessagingShell")
> {
  workspaceMessagingShellModulePromise ??=
    import("packages/features/messaging/components/workspace/WorkspaceMessagingShell");
  return workspaceMessagingShellModulePromise;
}
