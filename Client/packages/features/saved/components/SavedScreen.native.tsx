import React from "react";

import { Box } from "packages/ui/components/primitives/box";

import { SavedFeature } from "./SavedFeature";

export function SavedScreenNative() {
  return (
    <Box className="flex-1 bg-gray-50">
      <SavedFeature />
    </Box>
  );
}
