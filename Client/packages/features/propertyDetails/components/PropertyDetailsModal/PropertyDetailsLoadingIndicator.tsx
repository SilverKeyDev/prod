import React from "react";

import { KeyTurnLoader } from "packages/ui/components/index.web";

export const PropertyDetailsLoadingIndicator: React.FC = () => {
  return (
    <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-center">
        <KeyTurnLoader message="Loading property details..." variant="gray" />
      </div>
    </div>
  );
};
