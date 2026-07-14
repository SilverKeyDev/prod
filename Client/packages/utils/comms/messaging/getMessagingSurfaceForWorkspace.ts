import type { WorkspaceMessagingPersonaId } from "packages/utils/comms/messaging/personas/types";
import type { Workspace } from "packages/utils/product/workspace";

export type AgentClientPersona = "buyer" | "seller" | "renter";

export type MessagingSurface =
  | { stack: "agent_client"; clientPersona: AgentClientPersona }
  | { stack: "workspace"; persona: WorkspaceMessagingPersonaId };

const WORKSPACE_TO_PERSONA: Partial<Record<Workspace, WorkspaceMessagingPersonaId>> = {
  brokerage: "brokerage",
  integration_partner: "integrator",
};

/** Maps dashboard workspace to the messaging stack + persona overlay. */
export function getMessagingSurfaceForWorkspace(workspace: Workspace): MessagingSurface | null {
  if (workspace === "buyer") {
    return { stack: "agent_client", clientPersona: "buyer" };
  }
  if (workspace === "seller") {
    return { stack: "agent_client", clientPersona: "seller" };
  }
  if (workspace === "renter") {
    return { stack: "agent_client", clientPersona: "renter" };
  }
  const persona = WORKSPACE_TO_PERSONA[workspace];
  if (persona) {
    return { stack: "workspace", persona };
  }
  return null;
}
