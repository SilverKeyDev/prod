import { useEffect, useRef, useState } from "react";

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [marginBottom, setMarginBottom] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setMarginBottom(height * 1.2);
    }
  }, [title]);

  return (
    <div style={{ marginBottom: `${marginBottom}px` }}>
      <div
        ref={headerRef}
        className="bg-white border-b border-beige/40 rounded-2xl mx-2 mt-2 relative z-30"
      >
        <div className="px-2 py-2">
          <div className="flex items-center justify-center">
            <h1 className="text-base sm:text-lg font-bold text-navy text-center">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
