import { INTEGRATION_PARTNER_TRANSLATIONS } from "packages/features/integrationPartner/types/translations";
import type { WorkspaceMessagingPersonaConfig } from "packages/features/messaging/types/workspace/personas";

export const integratorMessagingPersona: WorkspaceMessagingPersonaConfig = {
  id: "integrator",
  pageTitle: "Integrator messaging",
  sidebarTitle: "Messages",
  sections: [
    { id: "support", title: "Platform support", kinds: ["platform_support"] },
    { id: "brokerages", title: "Brokerages", kinds: ["integrator_brokerage"] },
  ],
  listKinds: ["platform_support", "integrator_brokerage"],
  inputPlaceholder: "Message…",
  emptySidebarTitle: "No conversations yet",
  emptySidebarMessage: INTEGRATION_PARTNER_TRANSLATIONS.INTEGRATION_PARTNER_MESSAGING_EMPTY_SIDEBAR,
  emptyThreadTitle: "Select a conversation",
  emptyThreadMessage: "Choose a thread from the sidebar or start a new one.",
  supportCreateLabel: "Contact platform support",
  newConversationLabel: "Message a brokerage",
};
