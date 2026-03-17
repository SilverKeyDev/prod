import React from "react";

import { KeyTurnLoader } from "@/components/ui";

export const PropertyDetailsLoadingIndicator: React.FC = () => {
  return (
    <div className="border-border bg-background-surface sticky bottom-0 z-10 border-t px-6 py-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-center">
        <KeyTurnLoader message="Loading property details..." variant="gray" />
      </div>
    </div>
  );
};
