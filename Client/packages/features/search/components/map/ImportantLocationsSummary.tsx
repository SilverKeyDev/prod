import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";

import { BodyText } from "@/components/ui";
const MAX_VISIBLE = 3;
const ADDRESS_MAX_LENGTH = 28;
function truncateAddress(address: string): string {
  if (address.length <= ADDRESS_MAX_LENGTH) return address;
  return `${address.slice(0, ADDRESS_MAX_LENGTH - 3)}...`;
}
export default function ImportantLocationsSummary(): React.ReactElement | null {
  const { t } = useLocalization();
  const { userPreferences } = useUserPreferences();
  const locations = userPreferences?.important_locations;
  if (!locations?.length) return null;
  const visible = locations.slice(0, MAX_VISIBLE);
  const remaining = locations.length - MAX_VISIBLE;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
      <Icon name="map-pin" className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {visible.map((loc, i) => (
          <BodyText
            key={i}
            as="span"
            size="xs"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5"
          >
            <BodyText as="span" size="xs" className="truncate text-gray-700">
              {truncateAddress(loc.address)}
            </BodyText>
            {loc.commute_tolerance != null && (
              <BodyText as="span" size="xs" muted>
                {t("search.commute_min", {
                  minutes: loc.commute_tolerance,
                })}
              </BodyText>
            )}
          </BodyText>
        ))}
        {remaining > 0 && (
          <BodyText as="span" size="xs" muted className="shrink-0">
            {t("search.locations_more", { count: remaining })}
          </BodyText>
        )}
      </div>
    </div>
  );
}
