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

/** sectioned = labeled groups; pinned_support = flat inbox with support pinned at top */
export type WorkspaceMessagingSidebarLayout = "sectioned" | "pinned_support";

export type WorkspaceMessagingPersonaConfig = {
  id: WorkspaceMessagingPersonaId;
  pageTitle: string;
  sidebarTitle: string;
  sections: WorkspaceMessagingSection[];
  listKinds: WorkspaceConversationKind[];
  /** Defaults to sectioned when omitted (integrator / admin). */
  sidebarLayout: WorkspaceMessagingSidebarLayout;
  /** Pinned row label when sidebarLayout is pinned_support. */
  pinnedSupportTitle?: string;
  adminScope?: boolean;
  inputPlaceholder: string;
  emptySidebarTitle: string;
  emptySidebarMessage: string;
  emptyThreadTitle: string;
  emptyThreadMessage: string;
  /** Empty when support is opened via pinned row instead of a header CTA. */
  supportCreateLabel: string;
  newConversationLabel: string;
};

/** Kinds used for eligible-contacts lookup (excludes support — created via dedicated action). */
export function eligibleContactKindsForPersona(
  persona: WorkspaceMessagingPersonaConfig
): WorkspaceConversationKind[] {
  return persona.listKinds.filter((k) => k !== "platform_support");
}
