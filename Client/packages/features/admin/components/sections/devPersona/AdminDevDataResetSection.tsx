import { useCallback, useMemo, useState } from "react";

import { isDevelopment } from "packages/config/env";
import { useLocalization } from "packages/contexts";
import type { DevUserDataResetScope } from "packages/features/admin/api/admin";
import { useResetDevUserDataMutation } from "packages/hooks/data/admin/useResetDevUserDataMutation";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import { AccessibleCheckboxInput, BodyText, Button, Input, Label, Title } from "@/components/ui";

const SCOPES: readonly DevUserDataResetScope[] = [
  "profile",
  "preferences",
  "docusign",
  "transaction_steps",
  "s3",
  "connections",
] as const;

type ScopeState = Record<DevUserDataResetScope, boolean>;

const DEFAULT_SCOPE_STATE: ScopeState = {
  profile: false,
  preferences: false,
  docusign: false,
  transaction_steps: false,
  s3: false,
  connections: false,
};

export function AdminDevDataResetSection() {
  const { t } = useLocalization();
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes("super_admin");

  const mutation = useResetDevUserDataMutation();
  const [scopeState, setScopeState] = useState<ScopeState>(DEFAULT_SCOPE_STATE);
  const [targetUserId, setTargetUserId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedScopes = useMemo(() => SCOPES.filter((s) => scopeState[s]), [scopeState]);

  const scopeLabel = useCallback(
    (scope: DevUserDataResetScope) => {
      switch (scope) {
        case "profile":
          return t("admin.dev_reset.scope_profile");
        case "preferences":
          return t("admin.dev_reset.scope_preferences");
        case "docusign":
          return t("admin.dev_reset.scope_docusign");
        case "transaction_steps":
          return t("admin.dev_reset.scope_transaction_steps");
        case "s3":
          return t("admin.dev_reset.scope_s3");
        case "connections":
          return t("admin.dev_reset.scope_connections");
        default:
          return scope;
      }
    },
    [t]
  );

  const handleReset = useCallback(async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (selectedScopes.length === 0) {
      setErrorMessage(t("admin.dev_reset.error_no_scopes"));
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        scopes: selectedScopes,
        userId: isSuperAdmin && targetUserId.trim() ? targetUserId.trim() : undefined,
      });
      const clearedList = SCOPES.filter((s) => result.cleared[s])
        .map((s) => scopeLabel(s))
        .join(", ");
      setSuccessMessage(
        t("admin.dev_reset.success")
          .replace("{scopes}", clearedList)
          .replace("{userId}", result.target_user_id)
      );
      setScopeState(DEFAULT_SCOPE_STATE);
      if (isSuperAdmin) {
        setTargetUserId("");
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t("admin.dev_reset.error_generic"));
    }
  }, [isSuperAdmin, mutation, scopeLabel, selectedScopes, t, targetUserId]);

  if (!isDevelopment) {
    return null;
  }

  const busy = mutation.isPending;
  const canSubmit = selectedScopes.length > 0 && !busy;

  return (
    <Box className="border-border mt-8 border-t pt-6">
      <Title size="md" as="h3" className="mb-2">
        {t("admin.dev_reset.title")}
      </Title>
      <BodyText size="sm" muted className="mb-4">
        {t("admin.dev_reset.description")}
      </BodyText>
      <BodyText size="sm" className="mb-4 text-amber-800 dark:text-amber-200">
        {t("admin.dev_reset.warning")}
      </BodyText>

      <Box className="mb-4 flex flex-col gap-2">
        {SCOPES.map((scope) => (
          <Label key={scope} size="sm" className="flex items-start gap-2">
            <AccessibleCheckboxInput
              checked={scopeState[scope]}
              className="border-border accent-primary focus:ring-primary/30 mt-0.5 h-4 w-4 shrink-0 rounded focus:outline-none focus:ring-2 focus:ring-offset-0"
              label={scopeLabel(scope)}
              onChange={() => setScopeState((prev) => ({ ...prev, [scope]: !prev[scope] }))}
              disabled={busy}
            />
            <BodyText as="span" size="sm">
              {scopeLabel(scope)}
            </BodyText>
          </Label>
        ))}
      </Box>

      {isSuperAdmin ? (
        <Box className="mb-4 max-w-xl">
          <Input
            label={t("admin.dev_reset.target_user_id_label")}
            placeholder={t("admin.dev_reset.target_user_id_placeholder")}
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            disabled={busy}
            autoComplete="off"
          />
          <BodyText size="xs" muted className="mt-1">
            {t("admin.dev_reset.target_user_id_hint")}
          </BodyText>
        </Box>
      ) : null}

      <Button
        variant="danger"
        size="sm"
        className="mb-4"
        disabled={!canSubmit}
        onPress={() => void handleReset()}
        iconName="trash-2"
      >
        {busy ? t("admin.dev_reset.resetting") : t("admin.dev_reset.reset_button")}
      </Button>

      {errorMessage ? (
        <BodyText size="sm" className="text-rose-700 dark:text-rose-300">
          {errorMessage}
        </BodyText>
      ) : null}
      {successMessage ? (
        <BodyText size="sm" className="text-green-700 dark:text-green-300">
          {successMessage}
        </BodyText>
      ) : null}
    </Box>
  );
}
