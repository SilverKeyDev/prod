import React, { useRef, useEffect, useState } from "react";

type MobileTopBarProps = {
  children: React.ReactNode;
  dynamicHeight?: boolean; // Allow dynamic height for components like GenerateReport
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  dynamicHeight = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(80); // Default height (h-20 = 80px)

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`bg-background fixed left-0 right-0 top-2 z-40 transition-all duration-300 ease-in-out md:hidden ${
          dynamicHeight ? "min-h-20" : "h-20"
        }`}
      >
        <div className="relative flex h-full w-full items-center justify-center px-4">
          {children}
        </div>
      </div>
      {/* Spacer to account for fixed positioning + 12px margin */}
      <div
        className="md:hidden"
        style={{ height: `${height + 12}px` }}
      />
    </>
  );
};

export default MobileTopBar;
