import UnifiedMessagingHeader, { HeaderMode } from "./UnifiedMessagingHeader";

type ClientChatHeaderProps = {
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  hasAgent: boolean;
  onSearchClick: () => void;
};

export default function ClientChatHeader({
  isSidebarExpanded,
  setIsSidebarExpanded,
  hasAgent,
  onSearchClick,
}: ClientChatHeaderProps) {
  const mode: HeaderMode = hasAgent ? "chat" : "no-agent";

  return (
    <UnifiedMessagingHeader
      mode={mode}
      isSidebarExpanded={isSidebarExpanded}
      setIsSidebarExpanded={setIsSidebarExpanded}
      onSearchClick={onSearchClick}
    />
  );
}
