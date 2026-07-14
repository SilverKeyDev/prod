import { adminSupportMessagingPersona } from "./adminSupportMessagingPersona";
import { brokerageMessagingPersona } from "./brokerageMessagingPersona";
import { integratorMessagingPersona } from "./integratorMessagingPersona";
import type { WorkspaceMessagingPersonaConfig, WorkspaceMessagingPersonaId } from "./types";

const PERSONA_REGISTRY: Record<WorkspaceMessagingPersonaId, WorkspaceMessagingPersonaConfig> = {
  brokerage: brokerageMessagingPersona,
  integrator: integratorMessagingPersona,
  admin_support: adminSupportMessagingPersona,
};

export function getWorkspaceMessagingPersona(
  id: WorkspaceMessagingPersonaId
): WorkspaceMessagingPersonaConfig {
  return PERSONA_REGISTRY[id];
}

export function allWorkspaceMessagingPersonas(): WorkspaceMessagingPersonaConfig[] {
  return Object.values(PERSONA_REGISTRY);
}
