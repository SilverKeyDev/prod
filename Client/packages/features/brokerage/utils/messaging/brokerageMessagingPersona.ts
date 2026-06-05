import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import type { WorkspaceMessagingPersonaConfig } from "packages/features/messaging/types/workspace/personas";

export const brokerageMessagingPersona: WorkspaceMessagingPersonaConfig = {
  id: "brokerage",
  pageTitle: "Brokerage messaging",
  sidebarTitle: "Messages",
  sections: [
    { id: "support", title: "Platform support", kinds: ["platform_support"] },
    { id: "agents", title: "Agents", kinds: ["brokerage_agent"] },
  ],
  listKinds: ["platform_support", "brokerage_agent"],
  inputPlaceholder: "Message…",
  emptySidebarTitle: "No conversations yet",
  emptySidebarMessage: BROKERAGE_TRANSLATIONS.BROKERAGE_MESSAGING_EMPTY_SIDEBAR,
  emptyThreadTitle: "Select a conversation",
  emptyThreadMessage: "Choose a thread from the sidebar or start a new one.",
  supportCreateLabel: "Contact platform support",
  newConversationLabel: "Message an agent",
};
