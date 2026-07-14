import React from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";

import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { DROPDOWN_TRIGGER_INNER_FOCUS_RESET } from "packages/ui/components/inputs/form/dropdown/dropdownStyles";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import {
  GEO_TYPE_LABELS,
  geoTypeIcon,
  type GoogleSuggestion,
  type SlipstreamSuggestion,
} from "./searchLocationBarTypes";

type SearchLocationSuggestionListProps = {
  slipstreamSuggestions: SlipstreamSuggestion[];
  googleSuggestions: GoogleSuggestion[];
  onSelectSlipstream: (s: SlipstreamSuggestion) => void;
  onSelectGoogle: (s: GoogleSuggestion) => void;
  showCurrentLocation?: boolean;
  isLocating?: boolean;
  onSelectCurrentLocation?: () => void;
};

export function SearchLocationSuggestionList({
  slipstreamSuggestions,
  googleSuggestions,
  onSelectSlipstream,
  onSelectGoogle,
  showCurrentLocation,
  isLocating,
  onSelectCurrentLocation,
}: SearchLocationSuggestionListProps): React.ReactElement | null {
  const hasSuggestions = slipstreamSuggestions.length > 0 || googleSuggestions.length > 0;
  if (!hasSuggestions && !showCurrentLocation) return null;

  const rowButtonClass = `w-full !justify-start rounded-none px-3 py-2 text-left font-normal hover:bg-neutral-50/90 ${DROPDOWN_TRIGGER_INNER_FOCUS_RESET}`;

  return (
    <ul
      className="bg-background-surface/95 z-dropdown absolute left-0 right-0 top-full mt-1 max-h-80 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200 shadow-lg backdrop-blur-sm"
      role="listbox"
    >
      {showCurrentLocation && onSelectCurrentLocation ? (
        <li>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectCurrentLocation}
            disabled={isLocating}
            className={rowButtonClass}
            iconName="target"
            contentAlign="start"
          >
            <Box className="flex w-full items-center gap-2 text-left">
              <BodyText as="span" size="sm" className="font-medium">
                {isLocating
                  ? (SEARCH_TRANSLATIONS["search.locating"] ?? "Finding your location...")
                  : (SEARCH_TRANSLATIONS["search.current_location"] ?? "Current Location")}
              </BodyText>
            </Box>
          </Button>
        </li>
      ) : null}
      {slipstreamSuggestions.length > 0 ? (
        <>
          <li className="pointer-events-none px-3 py-2">
            <BodyText size="xs" muted className="font-medium">
              Neighborhoods &amp; areas
            </BodyText>
          </li>
          {slipstreamSuggestions.map((s) => (
            <li key={`ss-${s.area.id}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectSlipstream(s)}
                className={rowButtonClass}
              >
                <Box className="flex w-full items-center gap-2 text-left">
                  <Icon
                    name={geoTypeIcon(s.area.geoType) as "map-pin"}
                    className="text-text-secondary h-4 w-4 shrink-0"
                  />
                  <Box className="min-w-0 flex-1">
                    <BodyText as="span" size="sm" className="text-left">
                      {s.area.label || s.area.name}
                    </BodyText>
                    {s.area.geoType ? (
                      <BodyText as="span" size="xs" muted className="ml-2">
                        {GEO_TYPE_LABELS[s.area.geoType] ?? "Area"}
                      </BodyText>
                    ) : null}
                  </Box>
                </Box>
              </Button>
            </li>
          ))}
        </>
      ) : null}
      {googleSuggestions.length > 0 ? (
        <>
          {slipstreamSuggestions.length > 0 ? (
            <li className="pointer-events-none px-3 py-2">
              <BodyText size="xs" muted className="font-medium">
                Addresses
              </BodyText>
            </li>
          ) : null}
          {googleSuggestions.map((s, idx) => (
            <li key={`gp-${idx}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectGoogle(s)}
                className={rowButtonClass}
              >
                <Box className="flex w-full items-center gap-2 text-left">
                  <Icon name="map-pin" className="text-text-secondary h-4 w-4 shrink-0" />
                  <BodyText as="span" size="sm" className="min-w-0 flex-1 text-left">
                    {s.description}
                  </BodyText>
                </Box>
              </Button>
            </li>
          ))}
        </>
      ) : null}
    </ul>
  );
}
