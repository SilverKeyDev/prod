import { useLocalization } from "packages/contexts";
import MiniLogo from "packages/ui/components/asset/MiniLogo";
import { Box } from "packages/ui/components/primitives";
import {
  SIDEBAR_INSET_HEADER_SHELL,
  sidebarInsetHeaderCollapseButtonClass,
  sidebarInsetHeaderGhostButtonClass,
  sidebarInsetHeaderIconButtonClass,
  sidebarInsetHeaderMenuToggleClass,
  sidebarInsetHeaderTitleClass,
} from "packages/ui/components/sidebar/sidebarTheme";

import { BodyText, Button, Title } from "@/components/ui";
export type HeaderMode =
  | "inbox"
  | "connection-requests"
  | "chat"
  | "no-agent"
  | "clients"
  | "agents";
type UnifiedMessagingHeaderProps = {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  onBackClick?: () => void;
  /** Pending incoming connection requests (badge on Requests control). */
  pendingConnectionRequestCount?: number;
  className?: string;
  chatTitle?: string;
  selectedClientName?: string;
  agentName?: string;
};

function ConnectionRequestsHeaderButton({
  onClick,
  label,
  pendingCount,
}: {
  onClick: () => void;
  label: string;
  pendingCount: number;
}) {
  return (
    <Box className="relative shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={sidebarInsetHeaderGhostButtonClass()}
        label={label}
        iconName="inbox"
      >
        <BodyText as="span" size="sm" className="text-text-secondary">
          {label}
        </BodyText>
      </Button>
      {pendingCount > 0 ? (
        <Box
          className="bg-destructive absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-semibold leading-none text-white"
          aria-hidden
        >
          {pendingCount > 9 ? "9+" : String(pendingCount)}
        </Box>
      ) : null}
    </Box>
  );
}
function HeaderLeftContent({
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
        <Title as="h2" size="lg" className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}>
          <MiniLogo size="sm" />
          {t("agent.inbox")}
        </Title>
      );
    case "clients":
      return (
        <Box className="flex items-center gap-2">
          <Title as="h2" size="lg" className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}>
            <MiniLogo size="sm" />
            {t("agent.clients")}
          </Title>
        </Box>
      );
    case "agents":
      return (
        <Box className="flex items-center gap-2">
          <Title as="h2" size="lg" className={`flex items-center gap-2 ${sidebarInsetHeaderTitleClass()}`}>
            <MiniLogo size="sm" />
            {t("agent.messaging_sidebar_agents")}
          </Title>
        </Box>
      );
    case "chat":
    case "no-agent":
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
function HeaderRightContent({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onSearchClick,
  onInboxClick,
  selectedClientName,
  pendingConnectionRequestCount = 0,
}: {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  selectedClientName?: string;
  pendingConnectionRequestCount?: number;
}) {
  const { t } = useLocalization();
  const collapseBtn =
    isSidebarExpanded && setIsSidebarExpanded ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSidebarExpanded(false)}
        className={sidebarInsetHeaderCollapseButtonClass()}
        label={t("agent.collapse_sidebar")}
        aria-expanded={isSidebarExpanded}
        iconName="chevron-left"
      />
    ) : null;
  switch (mode) {
    case "connection-requests":
      return <Box className="flex items-center gap-2">{collapseBtn}</Box>;
    case "inbox":
      return (
        <Box className="flex items-center gap-2">
          {onInboxClick ? (
            <ConnectionRequestsHeaderButton
              onClick={onInboxClick}
              label={t("agent.requests")}
              pendingCount={pendingConnectionRequestCount}
            />
          ) : null}
          {collapseBtn}
        </Box>
      );
    case "clients":
      return (
        <Box className="flex items-center gap-2">
          {onInboxClick ? (
            <ConnectionRequestsHeaderButton
              onClick={onInboxClick}
              label={t("agent.requests")}
              pendingCount={pendingConnectionRequestCount}
            />
          ) : null}
          {onSearchClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className={sidebarInsetHeaderGhostButtonClass()}
              label={t("agent.search_for_clients")}
              title={t("agent.search_for_clients")}
              iconName="plus"
            />
          )}
          {collapseBtn}
        </Box>
      );
    case "agents":
      return (
        <Box className="flex items-center gap-2">
          {onInboxClick ? (
            <ConnectionRequestsHeaderButton
              onClick={onInboxClick}
              label={t("agent.requests")}
              pendingCount={pendingConnectionRequestCount}
            />
          ) : null}
          {onSearchClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className={sidebarInsetHeaderGhostButtonClass()}
              label={t("agent.search_for_agent")}
              title={t("agent.search_agent_to_start_messaging")}
              iconName="plus"
            />
          )}
          {collapseBtn}
        </Box>
      );
    case "chat":
      return (
        <Box className="flex items-center gap-2">
          {selectedClientName && (
            <Title
              as="h3"
              size="sm"
              className={`${sidebarInsetHeaderTitleClass()} transition-opacity duration-300 ease-in-out ${
                isSidebarExpanded ? "opacity-0" : "opacity-100"
              }`}
            >
              {selectedClientName}
            </Title>
          )}
        </Box>
      );
    case "no-agent":
      return (
        <Box className="flex items-center gap-2">
          {onInboxClick ? (
            <ConnectionRequestsHeaderButton
              onClick={onInboxClick}
              label={t("agent.requests")}
              pendingCount={pendingConnectionRequestCount}
            />
          ) : null}
          {onSearchClick ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className={sidebarInsetHeaderGhostButtonClass()}
              label={t("agent.search_agent_to_start_messaging")}
              title={t("agent.search_agent_to_start_messaging")}
              iconName="search"
            >
              <BodyText as="span" size="sm" className="text-text-secondary">
                {t("agent.search_for_agent")}
              </BodyText>
            </Button>
          ) : null}
          {collapseBtn}
        </Box>
      );
  }
}
export default function UnifiedMessagingHeader({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onInboxClick,
  onBackClick,
  onSearchClick,
  pendingConnectionRequestCount = 0,
  className = "",
  chatTitle: _chatTitle,
  selectedClientName,
  agentName,
}: UnifiedMessagingHeaderProps) {
  return (
    <Box className={`${SIDEBAR_INSET_HEADER_SHELL} ${className}`}>
      <HeaderLeftContent
        mode={mode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onBackClick={onBackClick}
        agentName={agentName}
      />
      <HeaderRightContent
        mode={mode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onSearchClick={onSearchClick}
        onInboxClick={onInboxClick}
        selectedClientName={selectedClientName}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
      />
    </Box>
  );
}
