import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { formatAgentName, formatLotSize, formatPrice } from "packages/features/search";
import { BodyText, PropertyStat, Title } from "packages/ui/components/index.web";
import { Image } from "packages/ui/components/primitives/media";
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
    return formatLotSize(lotSizeValue * 43560);
  }
  return formatLotSize(lotSizeValue);
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
    <div className="relative h-28 overflow-hidden sm:h-32 md:h-36">
      <Image src={imageUrl} alt={address} className="h-full w-full object-cover" />
      <div className="absolute left-2 right-2 top-2 flex items-center justify-between">
        <div className="text-olive rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 text-xs font-medium backdrop-blur-sm sm:text-sm">
          {formatPrice(price, currency)}
        </div>
      </div>
    </div>
  );
}
function CompCardAddress({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <div className="mb-3 text-left">
      <div className="mb-1 flex items-center gap-1">
        <Icon name="map-pin" className="h-3 w-3 flex-shrink-0 text-gray-400" />
        <Title as="h3" size="sm" className="truncate font-medium text-black">
          {comp.address.streetAddress}
        </Title>
      </div>
      <BodyText as="p" size="xs" className="ml-4 truncate text-black/60 sm:text-sm">
        {`${comp.address.city}${t("house.address_separator")}${comp.address.state}${t("house.space")}${comp.address.zipcode}`}
      </BodyText>
    </div>
  );
}
function CompCardPropertyDetails({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <div className="mb-3 text-left">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
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
      </div>
    </div>
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
    <div className="mb-3 text-left">
      {lotSizeDisplay ? (
        <PropertyStat icon={<Icon name="map-pin" />} size="sm">
          {`${t("house.lot")}: ${lotSizeDisplay}`}
        </PropertyStat>
      ) : (
        <PropertyStat icon={<Icon name="map-pin" className="text-transparent" />} size="sm">
          {`${t("house.lot")}: ${" ".repeat(6)}`}
        </PropertyStat>
      )}
    </div>
  );
}
function CompCardAgent({ comp, t }: { comp: CompData; t: (key: string) => string }) {
  return (
    <div className="mt-auto space-y-2 text-left">
      <div className="flex items-center gap-1">
        <Icon name="user" className="h-2.5 w-2.5 flex-shrink-0 text-gray-400 sm:h-3 sm:w-3" />
        <BodyText as="span" className="text-xs text-gray-500 sm:text-sm">
          {`${t("house.agent")}: ${
            comp.attributionInfo?.agentName
              ? formatAgentName(comp.attributionInfo.agentName)
              : t("house.na")
          }`}
        </BodyText>
      </div>
    </div>
  );
}
export default function CompCard({ comp, className = "" }: CompCardProps) {
  const { t } = useLocalization();
  const imageUrl = comp.miniCardPhotos?.[0]?.url ?? "/defaut-home.jpg";
  const lotSizeDisplay = getCompLotSizeDisplay(comp);
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <CompCardImage
        imageUrl={imageUrl}
        address={comp.address.streetAddress}
        price={comp.price}
        currency={comp.currency}
      />
      <div className="flex flex-1 flex-col p-3">
        <CompCardAddress comp={comp} t={t} />
        <CompCardPropertyDetails comp={comp} t={t} />
        <CompCardLotSize lotSizeDisplay={lotSizeDisplay} t={t} />
        <CompCardAgent comp={comp} t={t} />
      </div>
    </div>
  );
}
