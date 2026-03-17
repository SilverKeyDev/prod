import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
type FeedFeatureTagsProps = {
  /** Feature tags (e.g. ["3 bed", "2 bath", "Pool"]). Not rendered when empty. */
  features?: string[] | null;
};
/**
 * Feature tags row for feed/reels bottom info.
 * Renders nothing when features is empty or missing.
 */
export function FeedFeatureTags({ features }: FeedFeatureTagsProps) {
  if (!features?.length) return null;
  return (
    <Box className="mt-1.5 flex flex-row flex-wrap gap-1.5">
      {features.map((label, i) => (
        <BodyText
          key={`${label}-${i}`}
          as="span"
          size="xs"
          className="bg-primary-muted text-text-secondary rounded-full px-2 py-0.5"
        >
          {label}
        </BodyText>
      ))}
    </Box>
  );
}
