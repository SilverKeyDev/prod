import React from "react";

type MobileTopBarProps = {
  children: React.ReactNode;
  sidebarExpanded: boolean;
  dynamicHeight?: boolean; // Allow dynamic height for components like GenerateReport
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  sidebarExpanded,
  dynamicHeight = false,
}) => {
  return (
    <div
      className={`bg-background/80 fixed left-0 right-0 top-2 z-40 backdrop-blur-sm transition-all duration-300 ease-in-out lg:hidden ${
        dynamicHeight ? "min-h-20" : "h-20"
      } ${
        sidebarExpanded
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex h-full w-full px-4">
        {/* Sidebar button area - reserve space */}
        <div className="w-16 flex-shrink-0" />

        {/* Children content area - aligned with sidebar button center, margin adapts to children size */}
        {children && (
          <div
            className="absolute left-20 right-4 flex items-center justify-center"
            style={{
              top: "32px", // Button center (40px from viewport) - MobileTopBar top (8px) = 32px
              transform: "translateY(-50%)", // Center children vertically at this position
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTopBar;
