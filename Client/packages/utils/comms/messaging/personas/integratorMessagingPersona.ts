import type { WorkspaceMessagingPersonaConfig } from "./types";

export const integratorMessagingPersona: WorkspaceMessagingPersonaConfig = {
  id: "integrator",
  pageTitle: "Integrator messaging",
  sidebarTitle: "Messages",
  sections: [
    { id: "support", title: "Platform support", kinds: ["platform_support"] },
    { id: "brokerages", title: "Brokerages", kinds: ["integrator_brokerage"] },
  ],
  listKinds: ["platform_support", "integrator_brokerage"],
  sidebarLayout: "sectioned",
  inputPlaceholder: "Message…",
  emptySidebarTitle: "No conversations yet",
  emptySidebarMessage:
    "Message platform support or brokerages that use your integration. Conversations appear here.",
  emptyThreadTitle: "Select a conversation",
  emptyThreadMessage: "Choose a thread from the sidebar or start a new one.",
  supportCreateLabel: "Contact platform support",
  newConversationLabel: "Message a brokerage",
};
