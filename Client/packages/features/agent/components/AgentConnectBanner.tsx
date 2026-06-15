import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { ProfileAvatar } from "packages/ui/components/media/avatar/ProfileAvatar";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { getPendingPublicAgentConnectMeta } from "packages/utils/growth/agent";

/**
 * Context strip shown on login/signup pages when the user arrived via an agent's
 * public profile Connect flow. Reads pending intent metadata from sessionStorage
 * synchronously — no loading state needed, renders null when nothing is pending.
 */
export function AgentConnectBanner() {
  const { t } = useLocalization();

  const meta = useMemo(() => getPendingPublicAgentConnectMeta(), []);

  if (!meta?.name) return null;

  return (
    <Box className="border-brand-accent/20 bg-brand-accent/5 flex items-center gap-3 rounded-lg border px-4 py-3">
      <Box className="ring-brand-accent/20 h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1">
        <ProfileAvatar
          imageUrl={meta.photoUrl}
          label={meta.name}
          imageClassName="h-full w-full object-cover"
        />
      </Box>
      <BodyText size="sm" className="text-text-secondary leading-snug">
        {t("profile.public.connect_banner", { agentName: meta.name })}
      </BodyText>
    </Box>
  );
}
