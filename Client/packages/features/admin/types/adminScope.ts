export type AdminScope = { kind: "platform" } | { kind: "brokerage"; brokerageId: string };

export type AdminSectionBaseProps = {
  /** Defaults to platform scope (current production admin). Brokerage reuses sections with brokerage scope. */
  scope?: AdminScope;
};

export const DEFAULT_ADMIN_SCOPE: AdminScope = { kind: "platform" };
