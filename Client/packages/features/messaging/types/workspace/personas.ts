export type WorkspaceConversationKind =
  | "platform_support"
  | "brokerage_agent"
  | "integrator_brokerage";

export type WorkspaceMessagingPersonaId = "brokerage" | "integrator" | "admin_support";

export type WorkspaceMessagingSection = {
  id: string;
  title: string;
  kinds: WorkspaceConversationKind[];
};

export type WorkspaceMessagingPersonaConfig = {
  id: WorkspaceMessagingPersonaId;
  pageTitle: string;
  sidebarTitle: string;
  sections: WorkspaceMessagingSection[];
  listKinds: WorkspaceConversationKind[];
  adminScope?: boolean;
  inputPlaceholder: string;
  emptySidebarTitle: string;
  emptySidebarMessage: string;
  emptyThreadTitle: string;
  emptyThreadMessage: string;
  supportCreateLabel: string;
  newConversationLabel: string;
};

/** Kinds used for eligible-contacts lookup (excludes support — created via dedicated action). */
export function eligibleContactKindsForPersona(
  persona: WorkspaceMessagingPersonaConfig
): WorkspaceConversationKind[] {
  return persona.listKinds.filter((k) => k !== "platform_support");
}
