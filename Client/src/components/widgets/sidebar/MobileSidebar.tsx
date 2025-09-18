import { Menu, X } from 'lucide-react';

import type { UserProfile } from '../../../core/schemas/user';

type MobileSidebarProps = {
  user?: UserProfile;
  onLogout: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
};

import Sidebar from './Sidebar';

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
        className={`fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-brown text-white transition-all duration-300 ease-in-out ${
          expanded ? 'translate-x-64' : 'translate-x-0'
        }`}
        aria-label={expanded ? 'Close sidebar' : 'Open sidebar'}
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
            className="fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 ease-in-out"
            onClick={onToggleExpanded}
          />

          {/* Sidebar Panel */}
          <div className="fixed left-0 top-0 z-40 h-full translate-x-0 transition-transform duration-300 ease-in-out">
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
