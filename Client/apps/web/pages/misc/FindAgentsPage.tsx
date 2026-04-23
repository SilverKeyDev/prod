import { useEffect } from "react";

import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import { useIsAgent } from "packages/hooks/store";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";
import { AgentDiscoveryView } from "@/features/agent/components/agentDiscovery/AgentDiscoveryView";

type FindAgentsPageProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<ReactNode | null>>;
};

export default function FindAgentsPage({ setMobileHeaderActions }: FindAgentsPageProps) {
  const { t } = useLocalization();
  const isAgent = useIsAgent();
  const { navigate } = useNavigation();

  useEffect(() => {
    if (!isAgent) return;
    navigate("DASHBOARD", undefined, { replace: true });
  }, [isAgent, navigate]);

  useEffect(() => {
    if (!setMobileHeaderActions) return;
    setMobileHeaderActions(
      <Title as="h1" size="md" className="font-semibold text-text-primary">
        {t("agent.discovery_page_title")}
      </Title>
    );
    return () => setMobileHeaderActions(null);
  }, [setMobileHeaderActions, t]);

  if (isAgent) {
    return null;
  }

  return (
    <Box className="w-full max-w-3xl pb-8">
      <Box className="mb-6 hidden md:block">
        <Title as="h1" size="xl" className="font-semibold text-text-primary">
          {t("agent.discovery_page_title")}
        </Title>
        <BodyText size="sm" muted className="mt-2">
          {t("agent.discovery_page_subtitle")}
        </BodyText>
      </Box>
      <AgentDiscoveryView isActive />
    </Box>
  );
}
