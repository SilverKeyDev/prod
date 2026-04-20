import type { ReactNode } from "react";

import { Box, Text } from "packages/ui/components/primitives";

type UpcomingEventsSectionProps = {
  sectionTitle?: string;
  children: ReactNode;
};

export function UpcomingEventsSection({ sectionTitle, children }: UpcomingEventsSectionProps) {
  return (
    <Box className="mt-6 gap-3">
      {sectionTitle ? (
        <Text className="text-text-primary text-lg font-medium">{sectionTitle}</Text>
      ) : null}
      {children}
    </Box>
  );
}
