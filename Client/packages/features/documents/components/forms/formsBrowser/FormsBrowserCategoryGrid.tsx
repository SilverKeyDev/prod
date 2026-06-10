import type { FormCategory } from "packages/features/documents/hooks/data/useFormsLibrary";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BaseCard from "packages/ui/components/surfaces/cards/BaseCard";
import { formatFormsLibraryCategoryLabel } from "packages/utils/transaction/documents";

import { BodyText, Subtitle } from "@/components/ui";

type FormsBrowserCategoryGridProps = {
  processedCategories: FormCategory[];
  libraryViewMode: "grid" | "list";
  onSelectCategory: (name: string) => void;
  onClose?: () => void;
  closeLabel: string;
  formLabelSingular: string;
  formLabelPlural: string;
};

export function FormsBrowserCategoryGrid({
  processedCategories,
  libraryViewMode,
  onSelectCategory,
  onClose,
  closeLabel,
  formLabelSingular,
  formLabelPlural,
}: FormsBrowserCategoryGridProps) {
  const categoryLayoutClass =
    libraryViewMode === "list"
      ? "gap-responsive-md flex w-full flex-col"
      : "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <Box className={categoryLayoutClass}>
      {processedCategories.map((category) => (
        <BaseCard
          key={category.name}
          variant="default"
          padding="md"
          rounded="lg"
          shadow="sm"
          hover
          cardType="searchpage"
          scale="md"
          width="full"
          background="white"
          className="cursor-pointer"
          onClick={() => onSelectCategory(category.name)}
        >
          <Box className="flex flex-row items-center justify-between gap-3">
            <Box className="min-w-0 flex-1">
              <Subtitle size="sm" className="text-text-primary line-clamp-2">
                {formatFormsLibraryCategoryLabel(category.name)}
              </Subtitle>
              <BodyText as="p" size="xs" muted className="mt-1">
                {category.forms.length}{" "}
                {category.forms.length === 1 ? formLabelSingular : formLabelPlural}
              </BodyText>
            </Box>
            <BodyText as="span" size="sm" muted className="flex-shrink-0">
              →
            </BodyText>
          </Box>
        </BaseCard>
      ))}

      {onClose ? (
        <Box className="mt-2">
          <Button variant="secondary" size="sm" onPress={onClose} label="Close" iconName="x">
            {closeLabel}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
