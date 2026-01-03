import React from "react";

type MobileTopBarProps = {
  children: React.ReactNode;
  dynamicHeight?: boolean; // Allow dynamic height for components like GenerateReport
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  dynamicHeight = false,
}) => {
  return (
    <div
      className={`bg-background/80 fixed left-0 right-0 top-2 z-40 backdrop-blur-sm transition-all duration-300 ease-in-out md:hidden ${
        dynamicHeight ? "min-h-20" : "h-20"
      }`}
    >
      <div className="relative flex h-full w-full items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
};

export default MobileTopBar;
