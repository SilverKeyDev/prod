import React from "react";

import KeyTurnLoader from "packages/ui/components/media/asset/loading/KeyTurnLoader";
import { Box } from "packages/ui/components/structure/primitives";

export const PropertyDetailsLoadingIndicator: React.FC = () => {
  return (
    <Box className="border-border bg-background-surface z-header sticky bottom-0 border-t px-6 py-4 shadow-lg backdrop-blur-sm">
      <Box className="flex items-center justify-center">
        <KeyTurnLoader message="Loading property details..." variant="gray" />
      </Box>
    </Box>
  );
};
