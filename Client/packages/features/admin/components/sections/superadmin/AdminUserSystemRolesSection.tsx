import { useCallback, useState } from "react";

import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { useUpdateUserSystemRolesMutation } from "packages/hooks/data/admin/useUpdateUserSystemRolesMutation";
import { log } from "packages/logger";
import { HttpError } from "packages/services/http/client";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import {
  AccessibleCheckboxInput,
  BodyText,
  Button,
  Dropdown,
  Input,
  Label,
  Title,
} from "@/components/ui";

import {
  GATE_ROLE_INTENT_OPTIONS,
  type GateRoleIntent,
  gateRoleIntentsToPayload,
} from "./adminGateRoleIntents";

export function AdminUserSystemRolesSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const [userIdInput, setUserIdInput] = useState("");
  const [adminIntent, setAdminIntent] = useState<GateRoleIntent>("unchanged");
  const [superIntent, setSuperIntent] = useState<GateRoleIntent>("unchanged");
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

    const { grant, revoke } = gateRoleIntentsToPayload(adminIntent, superIntent);
    if (grant.length === 0 && revoke.length === 0) {
      setErrorMessage('Choose at least one "Grant" or "Revoke" action for admin or super admin.');
      return;
    }

    try {
      const result = await mutation.mutateAsync({ user_id: userId, grant, revoke });
      setMessage(
        `Updated gate roles for ${result.user_id}: ${result.gate_roles.join(", ") || "(none)"}.`
      );
      setAdminIntent("unchanged");
      setSuperIntent("unchanged");
      setConfirmed(false);
      log.security("SECURITY", "[ADMIN_SUPER] Updated gate roles via admin API", {
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
      log.error("ERRORS", "[ADMIN_SUPER] gate role mutation failed", err);
    }
  }, [adminIntent, confirmed, mutation, superIntent, userIdInput]);

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h2" className="mb-2">
        Gate roles (database)
      </Title>
      <BodyText size="sm" muted className="mb-4 max-w-2xl">
        Super admins can attach or detach the SilverKey workspace roles tied to the admin panel.
        Provide the target user&apos;s primary key UUID; no roster search runs from this UI.
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

        <Button
          variant="primary"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={mutation.isPending}
        >
          Apply role intents
        </Button>
      </Box>
    </Card>
  );
}
