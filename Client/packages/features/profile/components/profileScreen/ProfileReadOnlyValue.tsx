import React from "react";

import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

export function ProfileReadOnlyValue({ value }: { value: string | number | undefined | null }) {
  return (
    <Box className="border-border bg-background-base rounded-lg border px-4 py-3">
      <Text className="text-text-primary text-base">
        {value === undefined || value === null || value === "" ? "Not specified" : String(value)}
      </Text>
    </Box>
  );
}
