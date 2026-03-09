import React from "react";

import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

export function ProfileReadOnlyValue({ value }: { value: string | number | undefined | null }) {
  return (
    <Box className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <Text className="text-base text-gray-900">
        {value === undefined || value === null || value === "" ? "Not specified" : String(value)}
      </Text>
    </Box>
  );
}
