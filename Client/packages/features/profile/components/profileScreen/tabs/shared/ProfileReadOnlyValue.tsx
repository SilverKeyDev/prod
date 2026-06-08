import React from "react";

import {
  PROFILE_NOT_SPECIFIED_LABEL,
  profileFieldValueClassName,
} from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";

export function ProfileReadOnlyValue({ value }: { value: string | number | undefined | null }) {
  const isEmpty = value === undefined || value === null || value === "";
  return (
    <Box className="border-border bg-background-base rounded-lg border px-4 py-3">
      <Text className={`text-base ${profileFieldValueClassName(value)}`}>
        {isEmpty ? PROFILE_NOT_SPECIFIED_LABEL : String(value)}
      </Text>
    </Box>
  );
}
