import { spacing } from "packages/design-tokens";
import { Calendar } from "packages/features/calendar";
import { Box } from "packages/ui/components/primitives";

type ClientCalendarProps = {
  userId: string;
};

export default function ClientCalendar({ userId }: ClientCalendarProps) {
  return (
    <Box style={{ marginTop: spacing(4) }}>
      <Calendar clientUserId={userId} />
    </Box>
  );
}
