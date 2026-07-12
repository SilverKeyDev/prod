import type { WorkspaceMessagingPersonaConfig } from "./types";

export const adminSupportMessagingPersona: WorkspaceMessagingPersonaConfig = {
  id: "admin_support",
  pageTitle: "Support inbox",
  sidebarTitle: "Support threads",
  sections: [{ id: "support", title: "All support", kinds: ["platform_support"] }],
  listKinds: ["platform_support"],
  sidebarLayout: "sectioned",
  adminScope: true,
  inputPlaceholder: "Reply to user…",
  emptySidebarTitle: "",
  emptySidebarMessage: "",
  emptyThreadTitle: "Select a support thread",
  emptyThreadMessage: "Choose a thread from the sidebar to view the conversation.",
  supportCreateLabel: "",
  newConversationLabel: "",
};
