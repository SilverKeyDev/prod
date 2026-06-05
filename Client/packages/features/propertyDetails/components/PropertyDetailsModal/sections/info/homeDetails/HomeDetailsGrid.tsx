import React from "react";

import { Box, Icon } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import type { HomeDetailsBlock } from "./columns/homeDetailsColumnTypes";

function HomeDetailsCategoryBlock({
  icon,
  title,
  lines,
  component,
}: HomeDetailsBlock): React.ReactElement {
  return (
    <Box className="mb-8 flex flex-row items-start gap-3 last:mb-0">
      <Icon name={icon} size={20} className="text-text-primary mt-0.5 shrink-0" aria-hidden />
      <Box className="flex min-w-0 flex-1 flex-col gap-1">
        <Title as="h4" size="sm" className="text-foreground font-semibold">
          {title}
        </Title>
        {component ? (
          component
        ) : (
          <>
            {lines?.map((line, i) => (
              <BodyText key={i} as="p" size="sm" className="text-text-primary leading-snug">
                {line}
              </BodyText>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}

export type HomeDetailsGridProps = {
  columns: [HomeDetailsBlock[], HomeDetailsBlock[], HomeDetailsBlock[]];
};

export function HomeDetailsGrid({ columns }: HomeDetailsGridProps): React.ReactElement {
  return (
    <Box className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
      {columns.map((blocks, colIndex) => (
        <Box key={colIndex} className="flex h-full min-h-0 min-w-0 flex-col">
          {blocks.map((block) => (
            <HomeDetailsCategoryBlock key={block.id} {...block} />
          ))}
        </Box>
      ))}
    </Box>
  );
}
