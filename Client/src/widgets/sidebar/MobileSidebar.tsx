import { Menu, X } from "lucide-react";
import { UserProfile } from "../../types/user";

interface MobileSidebarProps {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

import Sidebar from "./Sidebar";

export default function MobileSidebar({
  user,
  onLogout,
  expanded,
  onToggleExpanded,
}: MobileSidebarProps) {
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggleExpanded}
        className={`fixed top-4 left-4 z-50 h-12 w-12 flex items-center justify-center rounded-2xl bg-brown text-white transition-all duration-300 ease-in-out ${
          expanded ? "translate-x-64" : "translate-x-0"
        }`}
        aria-label={expanded ? "Close sidebar" : "Open sidebar"}
      >
        <div className="transition-transform duration-300 ease-in-out">
          {expanded ? <X size={28} /> : <Menu size={28} />}
        </div>
      </button>

      {/* Render sidebar panel and backdrop only when expanded */}
      {expanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out"
            onClick={onToggleExpanded}
          />

          {/* Sidebar Panel */}
          <div className="fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out translate-x-0">
            <Sidebar
              user={user}
              onLogout={onLogout}
              expanded={expanded}
              onToggleExpanded={onToggleExpanded}
              isMobile
              onLinkClick={() => onToggleExpanded()}
            />
          </div>
        </>
      )}
    </>
  );
}
