import { useCallback, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { useSetCurrentUserAgentStatusMutation } from "packages/hooks/data/admin/useSetCurrentUserAgentStatusMutation";
import type { AppDevPersona } from "packages/store";
import { useAuthStore, useDevAppPersonaStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { deriveDevAppPersonaFromProfile } from "packages/utils/admin/deriveDevAppPersonaFromProfile";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";

import { AdminDevDataResetSection } from "./AdminDevDataResetSection";

const PERSONAS: readonly AppDevPersona[] = ["buyer", "seller", "agent", "broker"] as const;

function personaToIsAgent(persona: AppDevPersona): boolean {
  return persona === "agent" || persona === "broker";
}

export function AdminDevPersonaSection({
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminSectionBaseProps) {
  const { t } = useLocalization();
  const user = useAuthStore((s) => s.user);
  const setActivePersona = useDevAppPersonaStore((s) => s.setActivePersona);

  const mutation = useSetCurrentUserAgentStatusMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activePersona = useMemo(() => deriveDevAppPersonaFromProfile(user ?? undefined), [user]);

  const personaLabel = useCallback(
    (p: AppDevPersona) => {
      switch (p) {
        case "agent":
          return t("admin.dev_persona.persona_agent");
        case "broker":
          return t("admin.dev_persona.persona_broker");
        case "buyer":
          return t("admin.dev_persona.persona_buyer");
        case "seller":
          return t("admin.dev_persona.persona_seller");
        default:
          return p;
      }
    },
    [t]
  );

  const handleSelectPersona = useCallback(
    async (p: AppDevPersona) => {
      setErrorMessage(null);
      try {
        await mutation.mutateAsync({ is_agent: personaToIsAgent(p) });
        setActivePersona(p);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Request failed");
      }
    },
    [mutation, setActivePersona]
  );

  const busy = mutation.isPending;

  return (
    <Card border="light" padding="lg" className="max-w-3xl">
      <Title size="lg" as="h2" className="mb-2">
        {t("admin.dev_persona.title")}
      </Title>
      <BodyText size="sm" muted className="mb-4">
        {t("admin.dev_persona.description")}
      </BodyText>
      <BodyText size="sm" className="mb-4 text-amber-800 dark:text-amber-200">
        {t("admin.dev_persona.warning")}
      </BodyText>

      <Box className="mb-4 flex flex-wrap gap-2">
        {PERSONAS.map((p) => (
          <Button
            key={p}
            variant={activePersona === p ? "primary" : "secondary"}
            size="sm"
            disabled={busy}
            onPress={() => void handleSelectPersona(p)}
          >
            {personaLabel(p)}
          </Button>
        ))}
      </Box>

      {activePersona === "broker" ? (
        <BodyText size="xs" muted className="mb-4">
          {t("admin.dev_persona.broker_note")}
        </BodyText>
      ) : null}

      {errorMessage ? (
        <BodyText size="sm" className="text-rose-700 dark:text-rose-300">
          {errorMessage}
        </BodyText>
      ) : null}

      <AdminDevDataResetSection />
    </Card>
  );
}
