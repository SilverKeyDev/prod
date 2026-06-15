export type GateRoleIntent = "unchanged" | "grant" | "revoke";

export const GATE_ROLE_INTENT_LABELS: Record<GateRoleIntent, string> = {
  unchanged: "Leave as-is",
  grant: "Grant",
  revoke: "Revoke",
};

export const GATE_ROLE_INTENT_OPTIONS = (["unchanged", "grant", "revoke"] as const).map(
  (value) => ({
    value,
    label: GATE_ROLE_INTENT_LABELS[value],
  })
);

export function gateRoleIntentsToPayload(
  admin: GateRoleIntent,
  superAdmin: GateRoleIntent
): { grant: ("admin" | "super_admin")[]; revoke: ("admin" | "super_admin")[] } {
  const grant: ("admin" | "super_admin")[] = [];
  const revoke: ("admin" | "super_admin")[] = [];

  if (admin === "grant") grant.push("admin");
  if (admin === "revoke") revoke.push("admin");
  if (superAdmin === "grant") grant.push("super_admin");
  if (superAdmin === "revoke") revoke.push("super_admin");

  return { grant, revoke };
}

export function formatGateRoles(roles: readonly string[]): string {
  if (roles.length === 0) return "(none)";
  return roles.join(", ");
}
