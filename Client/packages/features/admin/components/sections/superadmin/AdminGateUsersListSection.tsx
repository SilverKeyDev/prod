import { useCallback, useState } from "react";

import type { AdminGateUser } from "packages/api/admin";
import { useAdminGateUsersList } from "packages/features/admin/hooks/data/useAdminGateUsersList";
import { useUpdateUserSystemRolesMutation } from "packages/features/admin/hooks/data/useUpdateUserSystemRolesMutation";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { log } from "packages/logger";
import { HttpError } from "packages/services/http/client";
import { Box } from "packages/ui/components/structure/primitives";
import { ConfirmationDialog } from "packages/ui/components/surfaces/modals";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Button, Dropdown, Label, Title } from "@/components/ui";

import {
  formatGateRoles,
  GATE_ROLE_INTENT_OPTIONS,
  type GateRoleIntent,
  gateRoleIntentsToPayload,
} from "./adminGateRoleIntents";

export function AdminGateUsersListSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const { data, isLoading, error } = useAdminGateUsersList();
  const mutation = useUpdateUserSystemRolesMutation();

  const [editingUser, setEditingUser] = useState<AdminGateUser | null>(null);
  const [adminIntent, setAdminIntent] = useState<GateRoleIntent>("unchanged");
  const [superIntent, setSuperIntent] = useState<GateRoleIntent>("unchanged");
  const [editConfirmed, setEditConfirmed] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [userToRemove, setUserToRemove] = useState<AdminGateUser | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const admins = data?.admins ?? [];

  const closeEditModal = useCallback(() => {
    setEditingUser(null);
    setAdminIntent("unchanged");
    setSuperIntent("unchanged");
    setEditConfirmed(false);
    setEditError(null);
  }, []);

  const openEditModal = useCallback((admin: AdminGateUser) => {
    setEditingUser(admin);
    setAdminIntent("unchanged");
    setSuperIntent("unchanged");
    setEditConfirmed(false);
    setEditError(null);
  }, []);

  const resolveMutationError = useCallback((err: unknown, fallback: string) => {
    let message = err instanceof Error ? err.message : fallback;
    if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
      const body = err.parsedBody as { error?: string };
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    }
    return message;
  }, []);

  const handleApplyEdit = useCallback(async () => {
    if (!editingUser) return;
    setEditError(null);

    if (!editConfirmed) {
      setEditError("Confirm that role changes should be executed for this user.");
      return;
    }

    const { grant, revoke } = gateRoleIntentsToPayload(adminIntent, superIntent);
    if (grant.length === 0 && revoke.length === 0) {
      setEditError('Choose at least one "Grant" or "Revoke" action for admin or super admin.');
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        user_id: editingUser.user_id,
        grant,
        revoke,
      });
      log.security("SECURITY", "[ADMIN_SUPER] Updated gate roles from admin list", {
        target_user_id: result.user_id,
        gate_roles: result.gate_roles,
      });
      closeEditModal();
    } catch (err) {
      setEditError(resolveMutationError(err, "Role update failed"));
      log.error("ERRORS", "[ADMIN_SUPER] gate role edit from list failed", err);
    }
  }, [
    adminIntent,
    closeEditModal,
    editConfirmed,
    editingUser,
    mutation,
    resolveMutationError,
    superIntent,
  ]);

  const handleConfirmRemove = useCallback(async () => {
    if (!userToRemove) return;
    setRemoveError(null);

    const revoke: ("admin" | "super_admin")[] = [];
    if (userToRemove.gate_roles.includes("admin")) revoke.push("admin");
    if (userToRemove.gate_roles.includes("super_admin")) revoke.push("super_admin");

    try {
      const result = await mutation.mutateAsync({
        user_id: userToRemove.user_id,
        grant: [],
        revoke,
      });
      log.security("SECURITY", "[ADMIN_SUPER] Removed gate roles from admin list", {
        target_user_id: result.user_id,
        gate_roles: result.gate_roles,
      });
      setUserToRemove(null);
    } catch (err) {
      setRemoveError(resolveMutationError(err, "Failed to remove admin access"));
      log.error("ERRORS", "[ADMIN_SUPER] gate role remove from list failed", err);
    }
  }, [mutation, resolveMutationError, userToRemove]);

  return (
    <>
      <Card border="light" padding="lg" className="w-full">
        <Title size="lg" as="h2" className="mb-2">
          SilverKey admins
        </Title>
        <BodyText size="sm" muted className="mb-4 max-w-2xl">
          Users with admin panel access (`admin` or `super_admin` gate roles). Edit roles or remove
          access from this list.
        </BodyText>

        {error ? (
          <BodyText size="sm" className="text-red-600">
            {error instanceof Error ? error.message : "Failed to load admins."}
          </BodyText>
        ) : null}

        <Box className="overflow-x-auto">
          {isLoading ? (
            <BodyText size="sm" muted>
              Loading admins…
            </BodyText>
          ) : admins.length === 0 ? (
            <BodyText size="sm" muted>
              No gate-role users found.
            </BodyText>
          ) : (
            <table className="min-w-2xl w-full text-left text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">Roles</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.user_id} className="border-border/60 border-b">
                    <td className="py-2 pr-4">{admin.name || "—"}</td>
                    <td className="py-2 pr-4">{admin.email}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{admin.user_id}</td>
                    <td className="py-2 pr-4">{formatGateRoles(admin.gate_roles)}</td>
                    <td className="py-2">
                      <Box className="flex flex-row flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(admin)}
                          disabled={mutation.isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setRemoveError(null);
                            setUserToRemove(admin);
                          }}
                          disabled={mutation.isPending}
                        >
                          Remove
                        </Button>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Box>

        {removeError ? (
          <BodyText size="sm" className="mt-3 text-red-600">
            {removeError}
          </BodyText>
        ) : null}
      </Card>

      <ConfirmationDialog
        isOpen={Boolean(userToRemove)}
        title="Remove admin access"
        message={
          userToRemove
            ? `Remove all gate roles for ${userToRemove.name || userToRemove.email}? They will lose admin panel access.`
            : ""
        }
        confirmText="Remove access"
        cancelText="Cancel"
        onConfirm={() => {
          void handleConfirmRemove();
        }}
        onCancel={() => setUserToRemove(null)}
      />

      <BaseModal
        isOpen={Boolean(editingUser)}
        onClose={closeEditModal}
        title="Edit gate roles"
        size="md"
      >
        {editingUser ? (
          <Box className="flex flex-col gap-4">
            <BodyText size="sm" muted>
              {editingUser.name || editingUser.email} · {editingUser.user_id}
            </BodyText>
            <BodyText size="sm">Current roles: {formatGateRoles(editingUser.gate_roles)}</BodyText>

            <Box className="grid gap-3 sm:grid-cols-2">
              <Box>
                <Label size="sm">Admin role intent</Label>
                <Dropdown
                  className="mt-1"
                  label="Admin role intent"
                  hideLabel
                  size="sm"
                  value={adminIntent}
                  options={GATE_ROLE_INTENT_OPTIONS}
                  onChange={setAdminIntent}
                  disabled={mutation.isPending}
                />
              </Box>
              <Box>
                <Label size="sm">Super admin role intent</Label>
                <Dropdown
                  className="mt-1"
                  label="Super admin role intent"
                  hideLabel
                  size="sm"
                  value={superIntent}
                  options={GATE_ROLE_INTENT_OPTIONS}
                  onChange={setSuperIntent}
                  disabled={mutation.isPending}
                />
              </Box>
            </Box>

            <Label size="sm" className="flex items-start gap-2">
              <AccessibleCheckboxInput
                checked={editConfirmed}
                className="border-border accent-primary focus:ring-primary/30 mt-0.5 h-4 w-4 shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
                label="Confirm applying role intents"
                onChange={() => setEditConfirmed((v) => !v)}
                disabled={mutation.isPending}
              />
              <BodyText as="span" size="sm">
                The server refuses removing the final super_admin and blocks self-demotions that
                strip your own super privilege.
              </BodyText>
            </Label>

            {editError ? (
              <BodyText size="sm" className="text-red-600">
                {editError}
              </BodyText>
            ) : null}

            <Box className="flex flex-row justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleApplyEdit()}
                disabled={mutation.isPending}
              >
                Apply changes
              </Button>
            </Box>
          </Box>
        ) : null}
      </BaseModal>
    </>
  );
}
