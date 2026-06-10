import { Icon } from "packages/ui";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { ExternalAnchor } from "packages/ui/components/system/accessibility";

type EventVirtualMeetLinkProps = {
  meetLink?: string | null;
  pending?: boolean;
  placeholderWhenEmpty?: string;
  className?: string;
};

export function EventVirtualMeetLink({
  meetLink,
  pending = false,
  placeholderWhenEmpty,
  className = "",
}: EventVirtualMeetLinkProps) {
  if (meetLink) {
    return (
      <Box className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
        <Icon name="video" className="text-text-secondary h-4 w-4 shrink-0" aria-hidden />
        <ExternalAnchor href={meetLink} label="Join Google Meet">
          Join Google Meet
        </ExternalAnchor>
      </Box>
    );
  }

  if (pending) {
    return (
      <Box className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
        <Icon name="video" className="text-text-secondary h-4 w-4 shrink-0" aria-hidden />
        <Text className="text-text-secondary text-xs sm:text-sm">Meet link generating…</Text>
      </Box>
    );
  }

  if (placeholderWhenEmpty) {
    return (
      <Box className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
        <Icon name="video" className="text-text-secondary h-4 w-4 shrink-0" aria-hidden />
        <Text className="text-text-secondary text-xs sm:text-sm">{placeholderWhenEmpty}</Text>
      </Box>
    );
  }

  return null;
}
