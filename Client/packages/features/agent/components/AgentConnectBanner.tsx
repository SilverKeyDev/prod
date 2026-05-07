import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { ProfileAvatar } from "packages/ui/components/avatar/ProfileAvatar";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { getPendingPublicAgentConnectMeta } from "packages/utils/agent";

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
    <Box className="flex items-center gap-3 rounded-lg border border-brand-accent/20 bg-brand-accent/5 px-4 py-3">
      <Box className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-brand-accent/20">
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
