import { Box } from "packages/ui/components/primitives";
import { SIDEBAR_INSET_HEADER_SHELL } from "packages/ui/components/sidebar/sidebarTheme";

import { UnifiedMessagingHeaderLeft } from "./unifiedMessagingHeader/UnifiedMessagingHeaderLeft";
import { UnifiedMessagingHeaderRight } from "./unifiedMessagingHeader/UnifiedMessagingHeaderRight";
import type { HeaderMode } from "./unifiedMessagingHeader/unifiedMessagingHeaderTypes";

export type { HeaderMode } from "./unifiedMessagingHeader/unifiedMessagingHeaderTypes";

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
  /**
   * Master–detail: the list column header (sidebar) already shows Requests + add/search at `xl`.
   * Set on the **detail** column header so those controls are not duplicated beside the persistent sidebar.
   */
  suppressListColumnActionDuplicates?: boolean;
};

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
  suppressListColumnActionDuplicates = false,
}: UnifiedMessagingHeaderProps) {
  return (
    <Box className={`${SIDEBAR_INSET_HEADER_SHELL} ${className}`}>
      <UnifiedMessagingHeaderLeft
        mode={mode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onBackClick={onBackClick}
        agentName={agentName}
      />
      <UnifiedMessagingHeaderRight
        mode={mode}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        onSearchClick={onSearchClick}
        onInboxClick={onInboxClick}
        selectedClientName={selectedClientName}
        pendingConnectionRequestCount={pendingConnectionRequestCount}
        suppressListColumnActionDuplicates={suppressListColumnActionDuplicates}
      />
    </Box>
  );
}
