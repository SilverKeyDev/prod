import { Bath, Bed, MapPin, Square, User } from "lucide-react";

import { useLocalization } from "packages/contexts";
import {
  formatAgentName,
  formatLotSize,
  formatPrice,
} from "packages/utils/domain/search/address";

import {
  BodyText,
  Image,
  PropertyStat,
  Title,
} from "@/components/ui/index.web";

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
  miniCardPhotos?: Array<{ url: string }>;
  parentRegion?: { name: string };
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
  const lotSizeValue =
    typeof rawLotSize === "string" ? parseFloat(rawLotSize) : rawLotSize;
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
    <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
      <Image
        src={imageUrl}
        alt={address}
        className="h-full w-full object-cover"
      />
      <div className="absolute left-2 right-2 top-2 flex items-center justify-between">
        <div className="rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 backdrop-blur-sm text-xs sm:text-sm font-medium">
          {formatPrice(price, currency)}
        </div>
      </div>
    </div>
  );
}

function CompCardAddress({
  comp,
  t,
}: {
  comp: CompData;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-3 text-left">
      <div className="flex items-center gap-1 mb-1">
        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <Title as="h3" size="sm" className="font-medium text-black truncate">
          {comp.address.streetAddress}
        </Title>
      </div>
      <BodyText
        as="p"
        size="xs"
        className="text-black/60 truncate ml-4 sm:text-sm"
      >
        {`${comp.address.city}${t("cards.address_separator")}${comp.address.state}${t("cards.space")}${comp.address.zipcode}`}
      </BodyText>
    </div>
  );
}

function CompCardPropertyDetails({
  comp,
  t,
}: {
  comp: CompData;
  t: (key: string) => string;
}) {
  return (
    <div className="mb-3 text-left">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {comp.bedrooms > 0 && (
          <PropertyStat icon={<Bed />} size="sm">
            {comp.bedrooms}
            {t("cards.space")}
            {comp.bedrooms !== 1 ? t("cards.beds_plural") : t("cards.beds")}
          </PropertyStat>
        )}
        {comp.bathrooms > 0 && (
          <PropertyStat icon={<Bath />} size="sm">
            {comp.bathrooms}
            {t("cards.space")}
            {comp.bathrooms !== 1 ? t("cards.baths_plural") : t("cards.baths")}
          </PropertyStat>
        )}
        {comp.livingArea > 0 ? (
          <PropertyStat icon={<Square />} size="sm">
            {Math.round(comp.livingArea).toLocaleString()}
            {t("cards.space")}
            {t("cards.sqft")}
          </PropertyStat>
        ) : (
          <PropertyStat
            icon={<Square className="text-transparent" />}
            size="sm"
          >
            {`${" ".repeat(8)}${t("cards.sqft")}`}
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
        <PropertyStat icon={<MapPin />} size="sm">
          {`${t("cards.lot")}: ${lotSizeDisplay}`}
        </PropertyStat>
      ) : (
        <PropertyStat icon={<MapPin className="text-transparent" />} size="sm">
          {`${t("cards.lot")}: ${" ".repeat(6)}`}
        </PropertyStat>
      )}
    </div>
  );
}

function CompCardAgent({
  comp,
  t,
}: {
  comp: CompData;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-2 text-left mt-auto">
      <div className="flex items-center gap-1">
        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 flex-shrink-0" />
        <BodyText as="span" className="text-xs sm:text-sm text-gray-500">
          {`${t("cards.agent")}: ${
            comp.attributionInfo?.agentName
              ? formatAgentName(comp.attributionInfo.agentName)
              : t("cards.na")
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
