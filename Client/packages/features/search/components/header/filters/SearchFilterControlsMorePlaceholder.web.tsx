import React from "react";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, DropdownChevron } from "@/components/ui";

import { searchFilterControlsButtonBase } from "./searchFilterControls.web.styles";

export function SearchFilterControlsMorePlaceholder({
  t,
}: {
  t: (key: string) => string;
}): React.ReactElement {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      rounded="lg"
      className={`${searchFilterControlsButtonBase} justify-between`}
      iconName="search"
    >
      <Box className="flex w-full items-center justify-between gap-2">
        <BodyText as="span" size="sm" className="text-inherit">
          {t("search.more")}
        </BodyText>
        <DropdownChevron open={false} className="h-4 w-4" />
      </Box>
    </Button>
  );
}
