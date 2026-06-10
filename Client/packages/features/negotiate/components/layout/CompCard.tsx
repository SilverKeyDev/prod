import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box, Image } from "packages/ui/components/structure/primitives";
import {
  formatAgentName,
  formatLotSizeInAcres,
  formatPrice,
} from "packages/utils/core/format/property/addressFormatting";

import { BodyText, PropertyStat, Title } from "@/components/ui";

export type CompData = {
  address: {
    city: string;
    state: string;
    streetAddress: string;
    zipcode: string;
  };
  bathrooms: number;
  bedrooms: number;
  currency: string;
  homeStatus: string;
  homeType: string;
  latitude: number;
  livingArea: number;
  livingAreaUnits: string;
  livingAreaUnitsShort: string;
  longitude: number;
  lotAreaValue?: number;
  lotAreaUnits?: string;
  lotSize?: number;
  miniCardPhotos?: Array<{
    url: string;
  }>;
  parentRegion?: {
    name: string;
  };
  price: number;
  zpid: number;
  attributionInfo?: {
    agentName?: string;
    brokerName?: string;
    trueStatus?: string;
  };
};
type CompCardProps = {
  comp: CompData;
  className?: string;
};
function getCompLotSizeDisplay(comp: CompData): string | null {
  const rawLotSize = comp.lotAreaValue ?? comp.lotSize;
  if (!rawLotSize) return null;
  const lotSizeValue = typeof rawLotSize === "string" ? parseFloat(rawLotSize) : rawLotSize;
  if (isNaN(lotSizeValue) || lotSizeValue <= 0) return null;
  const unit = comp.lotAreaUnits?.toLowerCase();
  if (unit?.includes("acre")) {
    return formatLotSizeInAcres(`${lotSizeValue} acres`);
  }
  return formatLotSizeInAcres(lotSizeValue);
}
function CompCardImage({
  imageUrl,
  address,
  price,
  currency,
}: {
  imageUrl: string;
  address: string;
  price: number;
  currency: string;
}) {
  return (
    <Box className="relative h-28 overflow-hidden sm:h-32 md:h-36">
      <Image src={imageUrl} alt={address} className="h-full w-full object-cover" />
      <Box className="absolute left-2 right-2 top-2 flex items-center justify-between">
        <Box className="text-primary border-border bg-background-base rounded-full border px-2 py-1 text-xs font-medium backdrop-blur-sm sm:text-sm">
          {formatPrice(price, currency)}
        </Box>
      </Box>
    </Box>
  );
}
function CompCardAddress({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <Box className="mb-3 text-left">
      <Box className="mb-1 flex items-center gap-1">
        <Icon name="map-pin" className="text-text-disabled h-3 w-3 flex-shrink-0" />
        <Title as="h3" size="sm" className="text-text-primary truncate font-medium">
          {comp.address.streetAddress}
        </Title>
      </Box>
      <BodyText as="p" size="xs" className="text-text-secondary ml-4 truncate sm:text-sm">
        {`${comp.address.city}${t("house.address_separator")}${
          comp.address.state
        }${t("house.space")}${comp.address.zipcode}`}
      </BodyText>
    </Box>
  );
}
function CompCardPropertyDetails({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <Box className="mb-3 text-left">
      <Box className="flex flex-wrap gap-x-4 gap-y-2">
        {comp.bedrooms > 0 && (
          <PropertyStat icon={<Icon name="bed" />} size="sm">
            {comp.bedrooms}
            {t("house.space")}
            {comp.bedrooms !== 1 ? t("house.beds_plural") : t("house.beds")}
          </PropertyStat>
        )}
        {comp.bathrooms > 0 && (
          <PropertyStat icon={<Icon name="bath" />} size="sm">
            {comp.bathrooms}
            {t("house.space")}
            {comp.bathrooms !== 1 ? t("house.baths_plural") : t("house.baths")}
          </PropertyStat>
        )}
        {comp.livingArea > 0 ? (
          <PropertyStat icon={<Icon name="square" />} size="sm">
            {Math.round(comp.livingArea).toLocaleString()}
            {t("house.space")}
            {t("house.sqft")}
          </PropertyStat>
        ) : (
          <PropertyStat icon={<Icon name="square" className="text-transparent" />} size="sm">
            {`${" ".repeat(8)}${t("house.sqft")}`}
          </PropertyStat>
        )}
      </Box>
    </Box>
  );
}
function CompCardLotSize({
  lotSizeDisplay,
  t,
}: {
  lotSizeDisplay: string | null;
  t: (key: string) => string;
}) {
  return (
    <Box className="mb-3 text-left">
      {lotSizeDisplay ? (
        <PropertyStat icon={<Icon name="map-pin" />} size="sm">
          {`${t("house.lot")}: ${lotSizeDisplay}`}
        </PropertyStat>
      ) : (
        <PropertyStat icon={<Icon name="map-pin" className="text-transparent" />} size="sm">
          {`${t("house.lot")}: ${" ".repeat(6)}`}
        </PropertyStat>
      )}
    </Box>
  );
}
function CompCardAgent({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <Box className="mt-auto space-y-2 text-left">
      <Box className="flex items-center gap-1">
        <Icon name="user" className="text-text-disabled h-2.5 w-2.5 flex-shrink-0 sm:h-3 sm:w-3" />
        <BodyText as="span" className="text-text-secondary text-xs sm:text-sm">
          {`${t("house.agent")}: ${
            comp.attributionInfo?.agentName
              ? formatAgentName(comp.attributionInfo.agentName)
              : t("house.na")
          }`}
        </BodyText>
      </Box>
    </Box>
  );
}
export default function CompCard({ comp, className = "" }: CompCardProps) {
  const { t } = useLocalization();
  const imageUrl = comp.miniCardPhotos?.[0]?.url ?? "/defaut-home.jpg";
  const lotSizeDisplay = getCompLotSizeDisplay(comp);
  return (
    <Box
      className={`border-border bg-background-surface flex flex-col overflow-hidden rounded-lg border shadow-sm ${className}`}
    >
      <CompCardImage
        imageUrl={imageUrl}
        address={comp.address.streetAddress}
        price={comp.price}
        currency={comp.currency}
      />
      <Box className="flex flex-1 flex-col p-3">
        <CompCardAddress comp={comp} t={t} />
        <CompCardPropertyDetails comp={comp} t={t} />
        <CompCardLotSize lotSizeDisplay={lotSizeDisplay} t={t} />
        <CompCardAgent comp={comp} t={t} />
      </Box>
    </Box>
  );
}
