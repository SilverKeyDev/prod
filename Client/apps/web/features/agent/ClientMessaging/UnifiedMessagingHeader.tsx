import { Menu, ArrowLeft, Inbox, ChevronLeft } from "lucide-react";
import MiniLogo from "../../../components/ui/asset/MiniLogo";

export type HeaderMode = "inbox" | "connection-requests" | "chat" | "no-agent";

type UnifiedMessagingHeaderProps = {
  mode: HeaderMode;
  isSidebarExpanded?: boolean;
  setIsSidebarExpanded?: (expanded: boolean) => void;
  onSearchClick?: () => void;
  onInboxClick?: () => void;
  onBackClick?: () => void;
  className?: string;
};

export default function UnifiedMessagingHeader({
  mode,
  isSidebarExpanded = false,
  setIsSidebarExpanded,
  onInboxClick,
  onBackClick,
  className = "",
}: UnifiedMessagingHeaderProps) {
  // Constant height - using h-14 (56px) to ensure consistency
  const baseClasses = "flex-shrink-0 flex items-center justify-between border-b border-beige bg-white p-3 h-14";

  const renderLeftContent = () => {
    switch (mode) {
      case "connection-requests":
        return (
          <div className="flex items-center gap-2">
            {onBackClick && (
              <button
                onClick={onBackClick}
                className="flex items-center justify-center rounded-lg p-1.5 transition hover:bg-beige/10"
                aria-label="Back to inbox"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
              </button>
            )}
            <h2 className="text-lg font-medium text-black">
              Connection Requests
            </h2>
          </div>
        );
      case "inbox":
        return (
          <h2 className="flex items-center gap-2 text-lg font-medium text-black">
            <MiniLogo size="sm" />
            Inbox
          </h2>
        );
      case "chat":
      case "no-agent":
        return (
          <div className="flex items-center gap-2">
            {setIsSidebarExpanded && (
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="inline-flex items-center justify-center rounded-lg p-2 focus:outline-none xl:hidden"
                aria-label={
                  isSidebarExpanded ? "Close agent list" : "Open agent list"
                }
                aria-expanded={isSidebarExpanded}
              >
                {isSidebarExpanded ? (
                  <ArrowLeft className="h-5 w-5 text-black" />
                ) : (
                  <Menu className="h-5 w-5 text-black" />
                )}
              </button>
            )}
          </div>
        );
    }
  };

  const renderRightContent = () => {
    switch (mode) {
      case "connection-requests":
        return (
          <div className="flex items-center gap-2">
            {isSidebarExpanded && setIsSidebarExpanded && (
              <button
                onClick={() => setIsSidebarExpanded(false)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition hover:bg-beige/10 xl:hidden"
                aria-label="Collapse agent list"
                aria-expanded={isSidebarExpanded}
              >
                <ChevronLeft className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        );
      case "inbox":
        return (
          <div className="flex items-center gap-2">
            {onInboxClick && (
              <button
                onClick={onInboxClick}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition hover:bg-beige/10"
              >
                <Inbox className="h-4 w-4 text-black" />
                <span className="text-black/70">Requests</span>
              </button>
            )}
            {isSidebarExpanded && setIsSidebarExpanded && (
              <button
                onClick={() => setIsSidebarExpanded(false)}
                className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 transition hover:bg-beige/10 xl:hidden"
                aria-label="Collapse agent list"
                aria-expanded={isSidebarExpanded}
              >
                <ChevronLeft className="h-4 w-4 text-black" />
              </button>
            )}
          </div>
        );
      case "chat":
        return (
          <div className="flex items-center gap-2">
            <h3
              className={`text-sm font-medium text-black transition-opacity duration-300 ease-in-out ${isSidebarExpanded ? "opacity-0" : "opacity-100"}`}
            >
              Chat with your agent
            </h3>
          </div>
        );
    }
  };

  return (
    <div className={`${baseClasses} ${className}`}>
      {renderLeftContent()}
      {renderRightContent()}
    </div>
  );
}
