import { BodyText } from "packages/ui/components/index.web";

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
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {features.map((label, i) => (
        <BodyText
          key={`${label}-${i}`}
          as="span"
          size="xs"
          className="rounded-full bg-white/20 px-2 py-0.5 text-white/90 backdrop-blur-sm"
        >
          {label}
        </BodyText>
      ))}
    </div>
  );
}
