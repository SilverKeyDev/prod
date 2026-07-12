import { useLocalization } from "packages/contexts";
import type { PublicAgentListing } from "packages/features/profile/hooks/data/usePublicAgentListings";
import { Link } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import {
  CardImageContainer,
  CardPropertyDetails,
} from "packages/ui/components/surfaces/cards/base/index.web";
import { addressStreetLineForCard } from "packages/utils/core/format/property/addressFormatting";
import { buildPropertyUrl } from "packages/utils/transaction/property";

const CARD_CLASS =
  "border-border bg-background-base group block h-full overflow-hidden rounded-2xl border !no-underline shadow-sm motion-safe:transition-shadow hover:shadow-md";

/** Cached values are display strings ("2364", "6"); details row wants numbers. */
function asNumber(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

type PublicListingCardProps = {
  listing: PublicAgentListing;
};

/**
 * Slim public-site listing card (no save/not-interested chrome — visitors are
 * unauthenticated). Links to the property page when the listing has a zpid.
 * MLS attribution (brokerage + listing number) is always rendered on the card
 * per RESPA guidance for this surface.
 */
export function PublicListingCard({ listing }: PublicListingCardProps) {
  const { t } = useLocalization();

  const address = listing.address?.trim() ?? "";
  const streetLine = address ? addressStreetLineForCard(address) : "";
  const localityLine = [listing.city, listing.state].filter((part) => part?.trim()).join(", ");
  const locality = [localityLine, listing.zipcode?.trim()].filter(Boolean).join(" ");
  const isSold = listing.status_category === "sold";

  const attribution = [
    listing.brokerage?.trim() || null,
    listing.mls_home_id?.trim()
      ? t("profile.public.listings.mls_number", { id: listing.mls_home_id.trim() })
      : null,
  ].filter((item): item is string => Boolean(item));

  const body = (
    <>
      <Box className="relative">
        <CardImageContainer
          imageUrl={listing.primary_image_url ?? undefined}
          alt={address || t("profile.public.listings.photo_fallback_alt")}
          height="responsive"
          className="rounded-t-2xl"
        />
        {isSold ? (
          <Box className="absolute left-3 top-3">
            <BodyText
              as="span"
              size="xs"
              className="bg-text-primary/80 rounded-full px-3 py-1 font-semibold uppercase tracking-wide !text-white backdrop-blur-sm"
            >
              {t("profile.public.listings.sold_badge")}
            </BodyText>
          </Box>
        ) : null}
      </Box>
      <Box className="gap-1 p-4">
        {listing.price?.trim() ? (
          <BodyText as="p" size="md" className="text-text-primary font-semibold tabular-nums">
            {listing.price}
          </BodyText>
        ) : null}
        <Title as="h4" size="sm" className="text-text-primary line-clamp-1 font-medium">
          {streetLine || t("profile.public.listings.address_fallback")}
        </Title>
        {locality ? (
          <BodyText as="p" size="sm" className="text-text-secondary">
            {locality}
          </BodyText>
        ) : null}
        <CardPropertyDetails
          bedrooms={asNumber(listing.beds)}
          bathrooms={asNumber(listing.baths)}
          sqft={asNumber(listing.sqft)}
          variant="horizontal"
          className="[&_*]:!text-text-secondary mt-1 justify-start"
        />
        {attribution.length ? (
          <BodyText as="p" size="xs" muted className="mt-2 line-clamp-1">
            {attribution.join(" · ")}
          </BodyText>
        ) : null}
      </Box>
    </>
  );

  if (listing.zpid && address) {
    // Accessible name comes from the card's visible address/price content.
    return (
      <Link to={buildPropertyUrl(listing.zpid, address)} className={CARD_CLASS}>
        {body}
      </Link>
    );
  }
  return <Box className={CARD_CLASS}>{body}</Box>;
}
