import React, { useState } from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box, Icon } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

const COLLAPSED_LINE_CLAMP = 4;

export const PropertyDescription: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { t } = useLocalization();
  const [expanded, setExpanded] = useState(false);

  const description = (property as unknown as Record<string, unknown>)
    .description;
  if (!description || typeof description !== "string" || !description.trim())
    return null;

  const text = description.trim();
  const isLong = text.length > 300;

  return (
    <Box className="px-6 py-6">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon
          name="file-text"
          size={20}
          className="text-text-primary shrink-0"
          aria-hidden
        />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {t("property_details.description_heading", {
            defaultValue: "About This Home",
          })}
        </Title>
      </Box>

      <Card border="light" className="mt-2 p-6">
        <BodyText
          as="p"
          size="sm"
          className={`text-text-primary whitespace-pre-line leading-relaxed ${
            !expanded && isLong ? `line-clamp-${COLLAPSED_LINE_CLAMP}` : ""
          }`}
          style={
            !expanded && isLong
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: COLLAPSED_LINE_CLAMP,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }
              : undefined
          }
        >
          {text}
        </BodyText>
        {isLong && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-3 px-0"
          >
            {expanded
              ? t("property_details.show_less", { defaultValue: "Show less" })
              : t("property_details.read_more", { defaultValue: "Read more" })}
          </Button>
        )}
      </Card>
    </Box>
  );
};
