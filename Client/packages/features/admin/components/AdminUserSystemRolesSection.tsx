import { useCallback, useState } from "react";

import type { UpdateUserSystemRolesRequest } from "packages/api/admin";
import { useUpdateUserSystemRolesMutation } from "packages/hooks/data/admin/useUpdateUserSystemRolesMutation";
import { log, LOG_CATEGORIES } from "packages/logger";
import { HttpError } from "packages/services/http/client";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { AccessibleCheckboxInput, BodyText, Button, Input, Label, Select, Title } from "@/components/ui";

type Intent = "unchanged" | "grant" | "revoke";

const INTENT_LABELS: Record<Intent, string> = {
  unchanged: "Leave as-is",
  grant: "Grant",
  revoke: "Revoke",
};

function intentsToPayload(admin: Intent, sup: Intent): Pick<UpdateUserSystemRolesRequest, "grant" | "revoke"> {
  const grant: ("admin" | "super_admin")[] = [];
  const revoke: ("admin" | "super_admin")[] = [];

  if (admin === "grant") grant.push("admin");
  if (admin === "revoke") revoke.push("admin");
  if (sup === "grant") grant.push("super_admin");
  if (sup === "revoke") revoke.push("super_admin");

  return { grant, revoke };
}

export function AdminUserSystemRolesSection() {
  const [userIdInput, setUserIdInput] = useState("");
  const [adminIntent, setAdminIntent] = useState<Intent>("unchanged");
  const [superIntent, setSuperIntent] = useState<Intent>("unchanged");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useUpdateUserSystemRolesMutation();

  const handleSubmit = useCallback(async () => {
    setMessage(null);
    setErrorMessage(null);
    const userId = userIdInput.trim();
    if (!userId) {
      setErrorMessage("Enter a target user ID.");
      return;
    }
    if (!confirmed) {
      setErrorMessage("Confirm that role changes should be executed against this UUID.");
      return;
    }

    const { grant, revoke } = intentsToPayload(adminIntent, superIntent);
    if (grant.length === 0 && revoke.length === 0) {
      setErrorMessage('Choose at least one "Grant" or "Revoke" action for admin or super admin.');
      return;
    }

    try {
      const result = await mutation.mutateAsync({ user_id: userId, grant, revoke });
      setMessage(`Updated gate roles for ${result.user_id}: ${result.gate_roles.join(", ") || "(none)"}.`);
      setAdminIntent("unchanged");
      setSuperIntent("unchanged");
      setConfirmed(false);
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_SUPER] Updated gate roles via admin API", {
        target_user_id: result.user_id,
        gate_roles: result.gate_roles,
      });
    } catch (err) {
      let messageErr = err instanceof Error ? err.message : "Role update failed";
      if (err instanceof HttpError && err.parsedBody && typeof err.parsedBody === "object") {
        const body = err.parsedBody as { error?: string };
        if (typeof body.error === "string" && body.error.length > 0) {
          messageErr = body.error;
        }
      }
      setErrorMessage(messageErr);
      log.error(LOG_CATEGORIES.ERRORS, "[ADMIN_SUPER] gate role mutation failed", err);
    }
  }, [adminIntent, confirmed, mutation, superIntent, userIdInput]);

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Gate roles (database)
      </Title>
      <BodyText size="sm" muted className="mb-4 max-w-2xl">
        Super admins can attach or detach the SilverKey workspace roles tied to the admin panel. Provide
        the target user&apos;s primary key UUID; no roster search runs from this UI.
      </BodyText>

      <Box className="flex max-w-xl flex-col gap-4">
        <Input
          label="Target user ID"
          placeholder="User ID (UUID)"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          disabled={mutation.isPending}
          autoComplete="off"
        />

        <Box className="grid gap-3 sm:grid-cols-2">
          <Box>
            <Label size="sm" className="mb-2 block">
              Admin role intent
            </Label>
            <Select
              value={adminIntent}
              options={(["unchanged", "grant", "revoke"] as const).map((v) => ({
                value: v,
                label: INTENT_LABELS[v],
              }))}
              onChange={(v) => setAdminIntent(v as Intent)}
              disabled={mutation.isPending}
            />
          </Box>
          <Box>
            <Label size="sm" className="mb-2 block">
              Super admin role intent
            </Label>
            <Select
              value={superIntent}
              options={(["unchanged", "grant", "revoke"] as const).map((v) => ({
                value: v,
                label: INTENT_LABELS[v],
              }))}
              onChange={(v) => setSuperIntent(v as Intent)}
              disabled={mutation.isPending}
            />
          </Box>
        </Box>

        <Label size="sm" className="flex items-start gap-2">
          <AccessibleCheckboxInput
            checked={confirmed}
            className="border-border accent-primary focus:ring-primary/30 mt-0.5 h-4 w-4 shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
            label="Confirm applying role intents"
            onChange={() => setConfirmed((v) => !v)}
            disabled={mutation.isPending}
          />
          <BodyText as="span" size="sm">
            The server refuses removing the final super_admin and blocks self-demotions that strip
            your own super privilege.
          </BodyText>
        </Label>

        {errorMessage ? (
          <BodyText size="sm" className="text-red-600">
            {errorMessage}
          </BodyText>
        ) : null}
        {message ? (
          <BodyText size="sm" muted>
            {message}
          </BodyText>
        ) : null}

        <Button variant="primary" size="sm" onClick={() => void handleSubmit()} disabled={mutation.isPending}>
          Apply role intents
        </Button>
      </Box>
    </Card>
  );
}
