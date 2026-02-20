import React from "react";

import { KeyTurnLoader } from "@ui/index.web";

export const PropertyDetailsLoadingIndicator: React.FC = () => {
  return (
    <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-4 shadow-lg">
      <div className="flex items-center justify-center">
        <KeyTurnLoader message="Loading property details..." variant="gray" />
      </div>
    </div>
  );
};
