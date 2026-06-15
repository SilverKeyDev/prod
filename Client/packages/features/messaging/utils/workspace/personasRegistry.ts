import { adminSupportMessagingPersona } from "packages/features/admin/utils/messaging/adminSupportMessagingPersona";
import { brokerageMessagingPersona } from "packages/features/brokerage/utils/messaging/brokerageMessagingPersona";
import { integratorMessagingPersona } from "packages/features/integrationPartner/utils/messaging/integratorMessagingPersona";
import type {
  WorkspaceMessagingPersonaConfig,
  WorkspaceMessagingPersonaId,
} from "packages/features/messaging/types/workspace/personas";

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
