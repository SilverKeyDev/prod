import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

type MessagingSidebarShellProps = {
  isSidebarExpanded: boolean;
  header: ReactNode;
  children: ReactNode;
};

/** Generic messaging sidebar chrome: responsive aside + scroll body. No feature cross-imports. */
export default function MessagingSidebarShell({
  isSidebarExpanded,
  header,
  children,
}: MessagingSidebarShellProps) {
  return (
    <aside
      className={`${
        isSidebarExpanded
          ? "z-sidebar absolute inset-0 flex xl:relative xl:inset-auto xl:z-0 xl:w-80"
          : "hidden xl:flex xl:w-80"
      } flex-col transition-transform duration-300 ease-in-out xl:rounded-l-xl`}
    >
      {header}
      <Box className="border-border bg-background-surface flex-1 overflow-y-auto border-r xl:rounded-bl-xl xl:rounded-br-none">
        {children}
      </Box>
    </aside>
  );
}
