import React from "react";

interface MobileTopBarProps {
  children: React.ReactNode;
  sidebarExpanded: boolean;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ children, sidebarExpanded }) => {
  return (
    <div
      className={`lg:hidden fixed top-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out ${
        sidebarExpanded
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex items-center justify-between w-full h-12">{children}</div>
    </div>
  );
};

export default MobileTopBar;
