import { useCallback, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { ADMIN_BASE_PATH, ADMIN_ROUTE_SEGMENTS } from "packages/features/admin/utils/navigation";
import { useNavigation } from "packages/navigation";
import { useAuthStore, useDevAppPersonaStore } from "packages/store";
import { BodyText, Button } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import { deriveDevAppPersonaFromProfile } from "packages/utils/admin/deriveDevAppPersonaFromProfile";
import { workspaceSwitcherLabelKey } from "packages/utils/workspace/workspaceNavConfig";

export function DevPersonaActiveBanner() {
  const { t } = useLocalization();
  const user = useAuthStore((s) => s.user);
  const serverIdentityTouched = useDevAppPersonaStore((s) => s.serverIdentityTouched);
  const { navigateToPath } = useNavigation();

  const personaLabel = useMemo(() => {
    const persona = deriveDevAppPersonaFromProfile(
      user
        ? {
            is_agent: Boolean(user.is_agent),
            roles: user.roles,
            brokerage_org_ids: user.brokerage_org_ids,
          }
        : null
    );
    if (!persona) {
      return t("admin.dev_persona.persona_unknown");
    }
    return t(workspaceSwitcherLabelKey(persona));
  }, [t, user]);

  const goToSettings = useCallback(() => {
    void navigateToPath(`${ADMIN_BASE_PATH}/${ADMIN_ROUTE_SEGMENTS.devPersona}`);
  }, [navigateToPath]);

  if (!serverIdentityTouched) {
    return null;
  }

  return (
    <Box className="border-border-subtle bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 md:px-6">
      <BodyText size="sm">
        {t("admin.dev_persona.banner_prefix")} {personaLabel}
      </BodyText>
      <Button variant="ghost" size="sm" onPress={goToSettings}>
        {t("admin.dev_persona.open_settings")}
      </Button>
    </Box>
  );
}
