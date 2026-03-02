import { BodyText } from "packages/ui/components/index.web";
import { formatUSD } from "packages/utils";

type FeedPriceProps = {
  /** Listing price in USD. Not rendered when missing. */
  price?: number | null;
};

/**
 * Price line for feed/reels bottom info.
 * Renders nothing when price is missing.
 */
export function FeedPrice({ price }: FeedPriceProps) {
  if (price == null || price <= 0) return null;
  return (
    <BodyText as="p" size="sm" className="mt-1 font-medium text-white/90">
      {formatUSD(price)}
    </BodyText>
  );
}
