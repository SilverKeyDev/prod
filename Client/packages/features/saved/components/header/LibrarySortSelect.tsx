import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import { librarySortOptionsForView } from "packages/features/saved/utils/librarySort";
import Dropdown from "packages/ui/components/form/dropdown";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type LibrarySortSelectProps = {
  viewType: SavedPageViewType;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Web: shared {@link Dropdown} for Library sort / DocuSign stage filter.
 */
export function LibrarySortSelect({ viewType, value, onChange }: LibrarySortSelectProps) {
  const { t } = useLocalization();
  const options = librarySortOptionsForView(viewType).map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));

  return (
    <Box className="flex min-w-0 shrink-0 items-center gap-2">
      <BodyText
        as="span"
        size="xs"
        className="text-text-secondary hidden whitespace-nowrap sm:inline"
      >
        {t("saved.library_sort_label")}
      </BodyText>
      <Dropdown
        options={options}
        value={value}
        onChange={onChange}
        placeholder={t("saved.library_sort_label")}
        label={t("saved.library_sort_label")}
        hideLabel
        size="sm"
        menuInPortal
        className="min-w-44 max-w-xs sm:min-w-52"
        maxVisibleOptions={10}
      />
    </Box>
  );
}
