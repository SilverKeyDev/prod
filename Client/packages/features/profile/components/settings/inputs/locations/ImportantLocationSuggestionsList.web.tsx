import React from "react";

import { Icon } from "@ui/icons";

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
    <ul
      id={suggestionsListId}
      role="listbox"
      className="bg-background-surface z-dropdown relative mt-2 flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md shadow-sm"
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={index}
          id={`${suggestionsListId}-option-${index}`}
          role="option"
          aria-selected={highlightedIndex === index}
          className="rounded border border-dotted border-neutral-300 first:border-t-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className={`w-full cursor-pointer !justify-start px-3 py-2 text-sm [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start ${
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
