import { useCallback, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { ADMIN_BASE_PATH, ADMIN_ROUTE_SEGMENTS } from "packages/features/admin/utils/navigation";
import { useNavigation } from "packages/navigation";
import type { AppDevPersona } from "packages/store";
import { useAuthStore, useDevAppPersonaStore } from "packages/store";
import { BodyText, Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import { deriveDevAppPersonaFromProfile } from "packages/utils/admin/deriveDevAppPersonaFromProfile";

function personaDisplayName(persona: AppDevPersona, t: (key: string) => string): string {
  switch (persona) {
    case "agent":
      return t("admin.dev_persona.persona_agent");
    case "broker":
      return t("admin.dev_persona.persona_broker");
    case "buyer":
      return t("admin.dev_persona.persona_buyer");
    case "seller":
      return t("admin.dev_persona.persona_seller");
    default:
      return persona;
  }
}

export function DevPersonaActiveBanner() {
  const { t } = useLocalization();
  const user = useAuthStore((s) => s.user);
  const sessionPersona = useDevAppPersonaStore((s) => s.persona);
  const { navigateToPath } = useNavigation();

  const derivedPersona = useMemo(() => deriveDevAppPersonaFromProfile(user ?? undefined), [user]);

  const personaName = useMemo(
    () => (derivedPersona ? personaDisplayName(derivedPersona, t) : ""),
    [derivedPersona, t]
  );

  const shellNote = useMemo(() => {
    if (!derivedPersona) return "";
    if (derivedPersona === "agent" || derivedPersona === "broker") {
      return t("admin.dev_persona.banner_agent_shell");
    }
    return t("admin.dev_persona.banner_client_shell");
  }, [derivedPersona, t]);

  const goToSettings = useCallback(() => {
    void navigateToPath(`${ADMIN_BASE_PATH}/${ADMIN_ROUTE_SEGMENTS.devPersona}`);
  }, [navigateToPath]);

  if (sessionPersona === null) {
    return null;
  }

  return (
    <Box className="border-border-subtle bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 md:px-6">
      <BodyText size="sm">
        {t("admin.dev_persona.banner_prefix")} {personaName} {shellNote}
      </BodyText>
      <Button variant="ghost" size="sm" onPress={goToSettings}>
        {t("admin.dev_persona.open_settings")}
      </Button>
    </Box>
  );
}
