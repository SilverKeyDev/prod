import { Calendar } from "packages/features/calendar";
import { Box } from "packages/ui/components/primitives";

type ClientCalendarProps = {
  userId: string;
  suppressClientAccessPrompt?: boolean;
};

export default function ClientCalendar({
  userId,
  suppressClientAccessPrompt = false,
}: ClientCalendarProps) {
  return (
    <Box className="w-full">
      <Calendar clientUserId={userId} suppressClientAccessPrompt={suppressClientAccessPrompt} />
    </Box>
  );
}
