import { useMemo, useState } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import { librarySortOptionsForView } from "packages/features/saved/utils/librarySort";
import { BaseModal } from "packages/ui/components/modals";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type LibrarySortControlNativeProps = {
  viewType: SavedPageViewType;
  value: string;
  onChange: (value: string) => void;
};

export function LibrarySortControlNative({
  viewType,
  value,
  onChange,
}: LibrarySortControlNativeProps) {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => librarySortOptionsForView(viewType), [viewType]);
  const selectedLabel = useMemo(() => {
    const match = options.find((o) => o.value === value);
    return match ? t(match.labelKey) : t(options[0]?.labelKey ?? "saved.library_sort_label");
  }, [options, t, value]);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onPress={() => setOpen(true)}
        className="shrink px-3 py-2"
      >
        <BodyText as="span" size="sm" className="text-text-primary font-medium" numberOfLines={1}>
          {t("saved.library_sort_label")}: {selectedLabel}
        </BodyText>
      </Button>
      <BaseModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("saved.library_sort_label")}
        size="md"
        showCloseButton
      >
        <Box className="max-h-96 gap-1">
          {options.map((o) => {
            const label = t(o.labelKey);
            const isActive = o.value === value;
            return (
              <Button
                key={o.value}
                variant={isActive ? "primary" : "ghost"}
                size="sm"
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="w-full justify-start py-3"
              >
                <BodyText
                  as="span"
                  size="sm"
                  className={isActive ? "text-white" : "text-text-primary"}
                >
                  {label}
                </BodyText>
              </Button>
            );
          })}
        </Box>
      </BaseModal>
    </>
  );
}
