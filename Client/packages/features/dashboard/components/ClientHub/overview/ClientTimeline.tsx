import React from "react";

import type { ClientTimelineEvent } from "packages/schemas/agent";
import SectionCard from "packages/ui/components/cards/SectionCard";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";

type ClientTimelineProps = {
  events: ClientTimelineEvent[];
};

const ClientTimeline: React.FC<ClientTimelineProps> = ({ events: _events }) => {
  return (
    <SectionCard title="Client Timeline" iconName="calendar">
      <Box className="flex justify-center py-8 text-center">
        <BodyText as="p" size="sm" className="text-text-secondary">
          Coming soon
        </BodyText>
      </Box>
    </SectionCard>
  );
};

export default ClientTimeline;
