import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import {
  sidebarInsetHeaderCollapseButtonClass,
  sidebarInsetHeaderGhostButtonClass,
  sidebarInsetHeaderTitleClass,
} from "packages/ui/components/sidebar/sidebarTheme";

import { BodyText, Button, Title } from "@/components/ui";

import { ConnectionRequestsHeaderButton } from "./ConnectionRequestsHeaderButton";
import type { HeaderMode } from "./unifiedMessagingHeaderTypes";

export function UnifiedMessagingHeaderRight({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onSearchClick,
  onInboxClick,
  selectedClientName,
  pendingConnectionRequestCount = 0,
  suppressListColumnActionDuplicates = false,
}: {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  selectedClientName?: string;
  pendingConnectionRequestCount?: number;
  suppressListColumnActionDuplicates?: boolean;
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
    case "no-client":
      if (suppressListColumnActionDuplicates) {
        return <Box className="flex items-center gap-2">{collapseBtn}</Box>;
      }
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
      if (suppressListColumnActionDuplicates) {
        return <Box className="flex items-center gap-2">{collapseBtn}</Box>;
      }
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
