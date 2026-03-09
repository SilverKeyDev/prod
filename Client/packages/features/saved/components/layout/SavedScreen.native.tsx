import React from "react";

import { SavedFeature } from "packages/features/saved/components/SavedFeature";
import { Box } from "packages/ui/components/primitives";

export function SavedScreenNative() {
  return (
    <Box className="flex-1 bg-gray-50">
      <SavedFeature />
    </Box>
  );
}
