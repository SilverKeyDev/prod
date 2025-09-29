import React from "react";

type MobileTopBarProps = {
  children: React.ReactNode;
  sidebarExpanded: boolean;
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  sidebarExpanded,
}) => {
  return (
    <div
      className={`bg-background/80 fixed left-0 right-0 top-0 z-40 p-4 backdrop-blur-sm transition-all duration-300 ease-in-out lg:hidden ${
        sidebarExpanded
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="relative flex min-h-12 w-full items-center">
        {/* Sidebar button area - reserve space */}
        <div className="w-16 flex-shrink-0" />

        {/* Children content area - centered between sidebar and right edge */}
        {children && (
          <div
            className="flex flex-1 items-center justify-center"
            style={{
              marginTop: "0vh",
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
