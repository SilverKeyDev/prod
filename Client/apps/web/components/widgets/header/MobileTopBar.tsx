import React, { useRef, useEffect, useState } from "react";

type MobileTopBarProps = {
  children: React.ReactNode;
  dynamicHeight?: boolean; // Allow dynamic height for components like GenerateReport
  /** When true, children take full width (e.g. messaging header with its own left/right layout) */
  fullWidth?: boolean;
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  dynamicHeight = false,
  fullWidth = false,
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
        } ${fullWidth ? "!h-auto min-h-14" : ""}`}
      >
        <header
          className={`relative flex h-full w-full items-center ${fullWidth ? "px-0" : "px-4"}`}
          aria-label="Page header"
        >
          {fullWidth ? (
            <div className="flex h-full w-full flex-1 items-center">
              {children}
            </div>
          ) : (
            <>
              {/* Left slot reserved for optional back/close actions */}
              <div className="flex h-full w-10 flex-shrink-0 items-center justify-start" />

              {/* Center slot for title and primary content */}
              <div className="flex min-w-0 flex-1 items-center justify-center text-center">
                {children}
              </div>

              {/* Right slot reserved for optional trailing actions */}
              <div className="flex h-full w-10 flex-shrink-0 items-center justify-end" />
            </>
          )}
        </header>
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
