import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import MiniLogo from "packages/ui/components/asset/MiniLogo";
import { Box } from "packages/ui/components/primitives";

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
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
        label={label}
      >
        <Icon name="inbox" className="h-4 w-4 text-neutral-600" />
        <BodyText as="span" size="sm" className="text-neutral-600">
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
              className="flex items-center justify-center rounded-lg p-1.5 text-neutral-700 transition hover:bg-neutral-100"
              label={t("agent.back_to_inbox")}
            >
              <Icon name="arrow-left" className="h-4 w-4 text-neutral-700" />
            </Button>
          )}
          <Title as="h2" size="sm" className="font-medium text-neutral-800">
            {t("agent.connection_requests")}
          </Title>
        </Box>
      );
    case "inbox":
      return (
        <Title
          as="h2"
          size="lg"
          className="flex items-center gap-2 font-medium text-neutral-800"
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
            className="flex items-center gap-2 font-medium text-neutral-800"
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
            className="flex items-center gap-2 font-medium text-neutral-800"
          >
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
              className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 focus:outline-none xl:hidden"
              label={
                isSidebarExpanded
                  ? t("agent.close_sidebar")
                  : t("agent.open_sidebar")
              }
              aria-expanded={isSidebarExpanded}
            >
              {isSidebarExpanded ? (
                <Icon name="arrow-left" className="h-5 w-5 text-neutral-700" />
              ) : (
                <Icon name="menu" className="h-5 w-5 text-neutral-700" />
              )}
            </Button>
          )}
          {mode === "chat" && agentName && (
            <Title as="h2" size="lg" className="font-medium text-neutral-800">
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
        className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-3 py-2 text-neutral-700 transition hover:bg-neutral-200 xl:hidden"
        label={t("agent.collapse_sidebar")}
        aria-expanded={isSidebarExpanded}
      >
        <Icon name="chevron-left" className="h-4 w-4 text-neutral-700" />
      </Button>
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
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
              label={t("agent.search_for_clients")}
              title={t("agent.search_for_clients")}
            >
              <Icon name="plus" className="h-4 w-4 text-neutral-600" />
            </Button>
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
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
              label={t("agent.search_for_agent")}
              title={t("agent.search_agent_to_start_messaging")}
            >
              <Icon name="plus" className="h-4 w-4 text-neutral-600" />
            </Button>
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
              className={`font-medium text-neutral-800 transition-opacity duration-300 ease-in-out ${
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
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
              label={t("agent.search_agent_to_start_messaging")}
              title={t("agent.search_agent_to_start_messaging")}
            >
              <Icon name="search" className="h-4 w-4 text-neutral-600" />
              <BodyText as="span" size="sm" className="text-neutral-600">
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
  const baseClasses =
    "flex w-full items-center justify-between border-b border-border bg-background-surface p-3 h-14";
  return (
    <Box className={`${baseClasses} ${className}`}>
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
