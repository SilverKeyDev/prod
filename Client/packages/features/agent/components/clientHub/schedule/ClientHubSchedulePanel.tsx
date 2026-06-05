import { Box } from "packages/ui/components/structure/primitives";

import { ClientHubAgenda } from "@/features/agent/components/clientHub/agenda/ClientHubAgenda";
import ClientCalendar from "@/features/agent/components/clientHub/calendar/ClientCalendar";

type ClientHubSchedulePanelProps = {
  clientId: string;
};

export function ClientHubSchedulePanel({ clientId }: ClientHubSchedulePanelProps) {
  return (
    <Box className="mt-1 flex w-full flex-col gap-4">
      <ClientHubAgenda clientId={clientId} />
      <ClientCalendar userId={clientId} suppressClientAccessPrompt />
    </Box>
  );
}
