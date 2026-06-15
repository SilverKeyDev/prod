import React from "react";

import { useStrictPreferencesToggle } from "packages/features/search/hooks/ui/useStrictPreferencesToggle";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, OliveCheckbox, Subtitle } from "@/components/ui";

export function SearchStrictPreferencesControlWeb(): React.ReactElement {
  const { preferencesStrictFilter, handleStrictPreferences } = useStrictPreferencesToggle();

  return (
    <Box className="border-border flex flex-col gap-1.5 border-t pt-6">
      <Box className="flex flex-row items-center justify-between gap-3">
        <BodyText as="span" size="sm" className="text-text-primary shrink-0">
          {SEARCH_TRANSLATIONS["search.strict_preferences"] ?? "Match all preferences strictly"}
        </BodyText>
        <OliveCheckbox
          checked={preferencesStrictFilter}
          onToggle={() => handleStrictPreferences(!preferencesStrictFilter)}
        />
      </Box>
      <Subtitle size="xs" muted className="pl-0 pr-10">
        {SEARCH_TRANSLATIONS["search.strict_preferences_hint"] ??
          "When off, we only apply every preference filter when there are more than 100 homes in the search area."}
      </Subtitle>
    </Box>
  );
}
