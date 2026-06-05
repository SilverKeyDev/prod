import React from "react";

import { SavedFeature } from "packages/features/saved/components/SavedFeature";
import { Box } from "packages/ui/components/structure/primitives";

export function SavedScreenNative() {
  return (
    <Box className="bg-background-base flex-1">
      <SavedFeature />
    </Box>
  );
}
