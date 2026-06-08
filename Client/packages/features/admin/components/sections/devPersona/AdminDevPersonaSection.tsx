import { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { useOpenDevAccountSessionMutation } from "packages/hooks/data/admin/useOpenDevAccountSessionMutation";
import { Region } from "packages/ui/components/accessibility";
import { ALL_WORKSPACES, type Workspace } from "packages/utils/workspace";
import { workspaceSwitcherLabelKey } from "packages/utils/workspace/workspaceNavConfig";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";

import { AdminDevDataResetSection } from "./AdminDevDataResetSection";

export function AdminDevPersonaSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const { t } = useLocalization();
  const mutation = useOpenDevAccountSessionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSetPersona = useCallback(
    async (workspace: Workspace) => {
      setErrorMessage(null);
      try {
        await mutation.mutateAsync(workspace);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Request failed");
      }
    },
    [mutation]
  );

  const busy = mutation.isPending;

  return (
    <Card border="light" padding="lg" className="max-w-3xl">
      <Title size="lg" as="h2" className="mb-2">
        {t("admin.dev_persona.title")}
      </Title>
      <BodyText size="sm" muted className="mb-6">
        {t("admin.dev_persona.description")}
      </BodyText>

      <Title size="md" as="h3" className="mb-2">
        {t("admin.dev_persona.persona_title")}
      </Title>
      <BodyText size="sm" muted className="mb-3">
        {t("admin.dev_persona.persona_description")}
      </BodyText>
      <BodyText size="sm" className="mb-4 text-amber-800 dark:text-amber-200">
        {t("admin.dev_persona.persona_warning")}
      </BodyText>

      <Region
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        label={t("admin.dev_persona.persona_title")}
      >
        {ALL_WORKSPACES.map((workspace) => {
          return (
            <Button
              key={workspace}
              variant="secondary"
              size="sm"
              disabled={busy}
              onPress={() => void handleSetPersona(workspace)}
            >
              {t(workspaceSwitcherLabelKey(workspace))}
            </Button>
          );
        })}
      </Region>

      {errorMessage ? (
        <BodyText size="sm" className="mb-4 text-rose-700 dark:text-rose-300">
          {errorMessage}
        </BodyText>
      ) : null}

      <AdminDevDataResetSection />
    </Card>
  );
}
