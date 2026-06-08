import type { FormCategory } from "packages/features/documents/hooks/data/useFormsLibrary";
import { Button } from "packages/ui";
import BaseCard from "packages/ui/components/cards/BaseCard";
import { AgendaListItemShell } from "packages/ui/components/patterns/AgendaListItemShell";
import { Box, TouchableBox } from "packages/ui/components/primitives";
import { formatFormsLibraryCategoryLabel } from "packages/utils/documents";

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

function FormsBrowserCategoryListRow({
  category,
  formLabelSingular,
  formLabelPlural,
  onSelectCategory,
}: {
  category: FormCategory;
  formLabelSingular: string;
  formLabelPlural: string;
  onSelectCategory: (name: string) => void;
}) {
  const handleActivate = () => onSelectCategory(category.name);

  return (
    <TouchableBox
      className="w-full"
      onPress={handleActivate}
      accessibilityRole="button"
      label={formatFormsLibraryCategoryLabel(category.name)}
    >
      <AgendaListItemShell
        accentBarClassName="bg-primary"
        header={
          <Box className="min-w-0 flex-1">
            <Subtitle size="sm" className="text-text-primary line-clamp-2">
              {formatFormsLibraryCategoryLabel(category.name)}
            </Subtitle>
            <BodyText as="p" size="xs" muted className="mt-1">
              {category.forms.length}{" "}
              {category.forms.length === 1 ? formLabelSingular : formLabelPlural}
            </BodyText>
          </Box>
        }
        footer={
          <BodyText as="span" size="sm" muted className="text-text-secondary">
            →
          </BodyText>
        }
      />
    </TouchableBox>
  );
}

export function FormsBrowserCategoryGrid({
  processedCategories,
  libraryViewMode,
  onSelectCategory,
  onClose,
  closeLabel,
  formLabelSingular,
  formLabelPlural,
}: FormsBrowserCategoryGridProps) {
  if (libraryViewMode === "list") {
    return (
      <Box className="gap-responsive-md flex w-full flex-col">
        {processedCategories.map((category) => (
          <FormsBrowserCategoryListRow
            key={category.name}
            category={category}
            formLabelSingular={formLabelSingular}
            formLabelPlural={formLabelPlural}
            onSelectCategory={onSelectCategory}
          />
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

  const categoryLayoutClass =
    "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <Box className={categoryLayoutClass}>
      {processedCategories.map((category) => (
        <TouchableBox
          key={category.name}
          className="w-full"
          onPress={() => onSelectCategory(category.name)}
          accessibilityRole="button"
          label={formatFormsLibraryCategoryLabel(category.name)}
        >
          <BaseCard
            variant="default"
            padding="md"
            rounded="lg"
            shadow="sm"
            hover
            cardType="searchpage"
            scale="md"
            width="full"
            background="white"
            className="w-full"
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
        </TouchableBox>
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
