import { BodyText } from "@/components/ui/index.web";

type FeedLocationProps = {
  /** City (e.g. "Austin"). */
  city?: string | null;
  /** State (e.g. "TX"). */
  state?: string | null;
};

/**
 * "City, State" line for feed/reels bottom info.
 * Renders nothing when both city and state are missing.
 */
export function FeedLocation({ city, state }: FeedLocationProps) {
  const hasCity = city?.trim();
  const hasState = state?.trim();
  if (!hasCity && !hasState) return null;
  const location =
    hasCity && hasState ? `${city}, ${state}` : hasCity ? city : (state ?? "");
  return (
    <BodyText as="p" size="sm" className="mt-1 text-white/80">
      {location}
    </BodyText>
  );
}
