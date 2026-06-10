import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

type MessagingSidebarShellProps = {
  isSidebarExpanded: boolean;
  header: ReactNode;
  children: ReactNode;
  /**
   * When set, expanded sidebar below `xl` is a partial-width overlay (not full-screen) with a
   * dismissible backdrop — use when the conversation thread stays mounted behind the list.
   */
  onOverlayDismiss?: () => void;
};

const MOBILE_OVERLAY_ASIDE =
  "z-sidebar absolute inset-y-0 left-0 flex w-80 max-w-[85vw] shadow-xl xl:relative xl:inset-auto xl:z-0 xl:w-80 xl:max-w-none xl:shadow-none";

const MOBILE_FULL_ASIDE =
  "z-sidebar absolute inset-0 flex xl:relative xl:inset-auto xl:z-0 xl:w-80";

/** Generic messaging sidebar chrome: responsive aside + scroll body. No feature cross-imports. */
export default function MessagingSidebarShell({
  isSidebarExpanded,
  header,
  children,
  onOverlayDismiss,
}: MessagingSidebarShellProps) {
  const mobileExpandedAside = onOverlayDismiss ? MOBILE_OVERLAY_ASIDE : MOBILE_FULL_ASIDE;

  return (
    <>
      {isSidebarExpanded && onOverlayDismiss ? (
        <Box
          className="bg-overlay-backdrop z-sidebar absolute inset-0 xl:hidden"
          aria-hidden
          onClick={onOverlayDismiss}
        />
      ) : null}
      <aside
        className={`${
          isSidebarExpanded ? `${mobileExpandedAside}` : "hidden xl:flex xl:w-80"
        } flex-col transition-transform duration-300 ease-in-out xl:rounded-l-xl`}
      >
        {header}
        <Box className="border-border bg-background-surface flex-1 overflow-y-auto border-r xl:rounded-bl-xl xl:rounded-br-none">
          {children}
        </Box>
      </aside>
    </>
  );
}
