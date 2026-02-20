import { ArrowLeft, ChevronLeft, Inbox, Menu, Plus } from "lucide-react";

import { useLocalization } from "packages/contexts";

import MiniLogo from "@/components/ui/asset/MiniLogo.web";
import { BodyText, Button, Title } from "@/components/ui/index.web";

export type HeaderMode =
  | "inbox"
  | "connection-requests"
  | "chat"
  | "no-agent"
  | "clients";

type UnifiedMessagingHeaderProps = {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  onBackClick?: () => void;
  className?: string;
  chatTitle?: string;
  selectedClientName?: string;
  agentName?: string;
};

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
        <div className="flex items-center gap-2">
          {onBackClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="flex items-center justify-center rounded-lg p-1.5 transition hover:bg-beige/10"
              label={t("agent.back_to_inbox")}
            >
              <ArrowLeft className="h-4 w-4 text-black" />
            </Button>
          )}
          <Title as="h2" size="lg" className="font-medium text-black">
            {t("agent.connection_requests")}
          </Title>
        </div>
      );
    case "inbox":
      return (
        <Title
          as="h2"
          size="lg"
          className="flex items-center gap-2 font-medium text-black"
        >
          <MiniLogo size="sm" />
          {t("agent.inbox")}
        </Title>
      );
    case "clients":
      return (
        <div className="flex items-center gap-2">
          <Title
            as="h2"
            size="lg"
            className="flex items-center gap-2 font-medium text-black"
          >
            <MiniLogo size="sm" />
            {t("agent.clients")}
          </Title>
        </div>
      );
    case "chat":
    case "no-agent":
      return (
        <div className="flex items-center gap-2">
          {setIsSidebarExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="inline-flex items-center justify-center rounded-lg p-2 focus:outline-none xl:hidden"
              label={
                isSidebarExpanded
                  ? t("agent.close_sidebar")
                  : t("agent.open_sidebar")
              }
              aria-expanded={isSidebarExpanded}
            >
              {isSidebarExpanded ? (
                <ArrowLeft className="h-5 w-5 text-black" />
              ) : (
                <Menu className="h-5 w-5 text-black" />
              )}
            </Button>
          )}
          {mode === "chat" && agentName && (
            <Title as="h2" size="lg" className="font-medium text-black">
              {agentName}
            </Title>
          )}
        </div>
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
}: {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  selectedClientName?: string;
}) {
  const { t } = useLocalization();
  const collapseBtn =
    isSidebarExpanded && setIsSidebarExpanded ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSidebarExpanded(false)}
        className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition hover:bg-beige/10 xl:hidden"
        label={t("agent.collapse_sidebar")}
        aria-expanded={isSidebarExpanded}
      >
        <ChevronLeft className="h-4 w-4 text-black" />
      </Button>
    ) : null;

  switch (mode) {
    case "connection-requests":
      return <div className="flex items-center gap-2">{collapseBtn}</div>;
    case "inbox":
      return (
        <div className="flex items-center gap-2">
          {onInboxClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInboxClick}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:bg-beige/10"
            >
              <Inbox className="h-4 w-4 text-black" />
              <BodyText as="span" size="sm" className="text-black/70">
                {t("agent.requests")}
              </BodyText>
            </Button>
          )}
          {collapseBtn}
        </div>
      );
    case "clients":
      return (
        <div className="flex items-center gap-2">
          {onSearchClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearchClick}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:bg-beige/10"
              label="Search for clients"
              title="Add client"
            >
              <Plus className="h-4 w-4 text-black" />
            </Button>
          )}
          {collapseBtn}
        </div>
      );
    case "chat":
      return (
        <div className="flex items-center gap-2">
          {selectedClientName && (
            <Title
              as="h3"
              size="sm"
              className={`font-medium text-black transition-opacity duration-300 ease-in-out ${isSidebarExpanded ? "opacity-0" : "opacity-100"}`}
            >
              {selectedClientName}
            </Title>
          )}
        </div>
      );
    case "no-agent":
      return null;
  }
}

export default function UnifiedMessagingHeader({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onInboxClick,
  onBackClick,
  onSearchClick,
  className = "",
  chatTitle: _chatTitle,
  selectedClientName,
  agentName,
}: UnifiedMessagingHeaderProps) {
  const baseClasses =
    "flex w-full items-center justify-between border-b border-beige bg-white p-3 h-14";
  return (
    <div className={`${baseClasses} ${className}`}>
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
      />
    </div>
  );
}
