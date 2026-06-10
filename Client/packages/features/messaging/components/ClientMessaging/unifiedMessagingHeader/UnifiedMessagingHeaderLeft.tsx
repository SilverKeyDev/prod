import { useLocalization } from "packages/contexts";
import MiniLogo from "packages/ui/components/media/asset/MiniLogo";
import { Box } from "packages/ui/components/structure/primitives";
import {
  sidebarInsetHeaderIconButtonClass,
  sidebarInsetHeaderMenuToggleClass,
  sidebarInsetHeaderTitleClass,
} from "packages/ui/components/structure/sidebar/sidebarTheme";

import { Button, Title } from "@/components/ui";

import type { HeaderMode } from "./unifiedMessagingHeaderTypes";

export function UnifiedMessagingHeaderLeft({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onBackClick,
  agentName,
}: {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onBackClick?: () => void;
  agentName?: string;
}) {
  const { t } = useLocalization();
  switch (mode) {
    case "connection-requests":
      return (
        <Box className="flex items-center gap-2">
          {onBackClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className={sidebarInsetHeaderIconButtonClass()}
              label={t("agent.back_to_inbox")}
              iconName="arrow-left"
            />
          )}
          <Title as="h2" size="sm" className={sidebarInsetHeaderTitleClass()}>
            {t("agent.connection_requests")}
          </Title>
        </Box>
      );
    case "inbox":
      return (
        <Title
          as="h2"
          size="lg"
          className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}
        >
          <MiniLogo size="sm" />
          {t("agent.inbox")}
        </Title>
      );
    case "clients":
      return (
        <Box className="flex items-center gap-2">
          <Title
            as="h2"
            size="lg"
            className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}
          >
            <MiniLogo size="sm" />
            {t("agent.clients")}
          </Title>
        </Box>
      );
    case "agents":
      return (
        <Box className="flex items-center gap-2">
          <Title
            as="h2"
            size="lg"
            className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}
          >
            <MiniLogo size="sm" />
            {t("agent.messaging_sidebar_agents")}
          </Title>
        </Box>
      );
    case "chat":
    case "no-agent":
    case "no-client":
      return (
        <Box className="flex items-center gap-2">
          {setIsSidebarExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className={sidebarInsetHeaderMenuToggleClass()}
              label={isSidebarExpanded ? t("agent.close_sidebar") : t("agent.open_sidebar")}
              aria-expanded={isSidebarExpanded}
              iconName={isSidebarExpanded ? "arrow-left" : "menu"}
            />
          )}
          {mode === "chat" && agentName && (
            <Title as="h2" size="lg" className={sidebarInsetHeaderTitleClass()}>
              {agentName}
            </Title>
          )}
        </Box>
      );
  }
}
