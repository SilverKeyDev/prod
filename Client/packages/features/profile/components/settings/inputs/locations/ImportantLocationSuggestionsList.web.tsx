import React from "react";

import { Icon } from "@ui/icons";

import {
  DROPDOWN_SUGGESTION_LIST_CLASSES,
  DROPDOWN_SUGGESTION_OPTION_CLASSES,
} from "packages/ui/components/inputs/form/dropdown/dropdownStyles";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button } from "@/components/ui";

import type { Suggestion } from "./importantLocationsInputTypes";

type ImportantLocationSuggestionsListProps = {
  suggestionsListId: string;
  suggestions: Suggestion[];
  highlightedIndex: number;
  onSelect: (suggestion: Suggestion) => void;
};

export function ImportantLocationSuggestionsList({
  suggestionsListId,
  suggestions,
  highlightedIndex,
  onSelect,
}: ImportantLocationSuggestionsListProps): React.ReactElement | null {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <ul id={suggestionsListId} role="listbox" className={DROPDOWN_SUGGESTION_LIST_CLASSES}>
      {suggestions.map((suggestion, index) => (
        <li
          key={index}
          id={`${suggestionsListId}-option-${index}`}
          role="option"
          aria-selected={highlightedIndex === index}
          className={index > 0 ? "border-t border-neutral-200" : undefined}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={`${DROPDOWN_SUGGESTION_OPTION_CLASSES} ${
              highlightedIndex === index ? "bg-neutral-200" : "hover:bg-neutral-100"
            }`}
          >
            <Box className="flex w-full items-center justify-start gap-2 text-left">
              <Icon name="map-pin" className="h-4 w-4 shrink-0 text-neutral-500" />
              <BodyText as="span" size="sm" className="min-w-0 flex-1 text-left">
                {suggestion.description}
              </BodyText>
            </Box>
          </Button>
        </li>
      ))}
    </ul>
  );
}
