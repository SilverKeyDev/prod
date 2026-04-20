import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

export function UnifiedMessageThreadRowDateDivider({ text }: { text: string }) {
  return (
    <Box className="flex items-center justify-center py-2">
      <Box className="rounded-full bg-black/5 px-3 py-1">
        <BodyText as="span" size="xs" className="text-text-secondary font-medium">
          {text}
        </BodyText>
      </Box>
    </Box>
  );
}
