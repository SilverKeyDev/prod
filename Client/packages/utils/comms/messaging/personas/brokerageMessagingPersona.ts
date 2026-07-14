import type { WorkspaceMessagingPersonaConfig } from "./types";

export const brokerageMessagingPersona: WorkspaceMessagingPersonaConfig = {
  id: "brokerage",
  pageTitle: "Brokerage messaging",
  sidebarTitle: "Messages",
  sections: [
    { id: "support", title: "Platform support", kinds: ["platform_support"] },
    { id: "agents", title: "Agents", kinds: ["brokerage_agent"] },
  ],
  listKinds: ["platform_support", "brokerage_agent"],
  sidebarLayout: "pinned_support",
  pinnedSupportTitle: "SilverKey support",
  inputPlaceholder: "Message…",
  emptySidebarTitle: "No conversations yet",
  emptySidebarMessage:
    "Message platform support or agents at your brokerage. Conversations appear here.",
  emptyThreadTitle: "Select a conversation",
  emptyThreadMessage: "Choose a thread from the sidebar or start a new one.",
  supportCreateLabel: "",
  newConversationLabel: "Message an agent",
};
