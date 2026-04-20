import React from "react";

import { Icon } from "@ui/icons";
import type { ReactNode } from "react";

import IconButton from "packages/ui/components/button/IconButton";
import { StyledImage } from "packages/ui/components/cards/base/image";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

export type SelectionBottomDockItem = {
  id: string;
  imageUrl?: string;
  thumbnailAlt: string;
};

export type SelectionBottomDockProps = {
  items: SelectionBottomDockItem[];
  countLabel: string;
  summaryIcon: ReactNode;
  thumbnailFallbackIcon?: ReactNode;
  onRemove: (id: string) => void;
  onClear: () => void;
  clearLabel: string;
  clearAriaLabel: string;
  removeThumbnailAriaLabel: string;
  moreCountLabel?: string;
  /** Merged onto the fixed outer shell (e.g. `md:left-52` when a nav sidebar reserves the left edge). */
  outerClassName?: string;
  children: ReactNode;
};

const defaultThumbFallback = <Icon name="image" className="text-text-disabled h-5 w-5" />;

/**
 * Fixed bottom strip for multi-select flows (compare, share bundle, etc.).
 * Layout only; callers supply copy and action region via `children`.
 */
export function SelectionBottomDock({
  items,
  countLabel,
  summaryIcon,
  thumbnailFallbackIcon = defaultThumbFallback,
  onRemove,
  onClear,
  clearLabel,
  clearAriaLabel,
  removeThumbnailAriaLabel,
  moreCountLabel,
  outerClassName,
  children,
}: SelectionBottomDockProps): React.ReactElement | null {
  if (items.length < 1) {
    return null;
  }

  const outerClasses = [
    "safe-bottom bottom-reserved border-border bg-background-surface z-dock fixed left-0 right-0 border-t shadow-lg md:bottom-0",
    outerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box className={outerClasses}>
      <Box className="px-responsive-md py-responsive-sm max-w-7xl self-center sm:px-6 sm:py-4">
        <Box className="gap-responsive-sm flex flex-row items-center sm:gap-4">
          <Box className="gap-responsive-sm flex flex-1 flex-row items-center">
            <Box className="flex-shrink-0">
              <Box className="bg-primary-muted flex h-8 w-8 flex-row items-center justify-center rounded-full sm:h-10 sm:w-10">
                {summaryIcon}
              </Box>
            </Box>
            <Box className="min-w-0 flex-1">
              <BodyText size="sm" className="font-medium">
                {countLabel}
              </BodyText>
            </Box>
            <Box className="gap-responsive-sm hidden flex-shrink-0 flex-row items-center sm:flex">
              {items.slice(0, 4).map((item) => (
                <Box
                  key={item.id}
                  className="border-border group relative h-12 w-12 overflow-hidden rounded-lg border-2"
                >
                  {item.imageUrl ? (
                    <StyledImage
                      src={item.imageUrl}
                      alt={item.thumbnailAlt}
                      variant="professional"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Box className="bg-primary-muted flex h-full w-full flex-row items-center justify-center">
                      {thumbnailFallbackIcon}
                    </Box>
                  )}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    variant="ghost"
                    size="xs"
                    rounded="full"
                    icon={<Icon name="x" className="h-3 w-3" />}
                    className="bg-background-surface absolute -right-1 -top-1 opacity-0 shadow-sm group-hover:opacity-100 group-active:opacity-75"
                    label={removeThumbnailAriaLabel}
                  />
                </Box>
              ))}
              {moreCountLabel ? (
                <Box className="border-border bg-background-base text-text-secondary flex h-12 w-12 flex-row items-center justify-center rounded-lg border-2 text-xs font-medium">
                  {moreCountLabel}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Box className="gap-responsive-sm flex min-w-0 flex-shrink-0 flex-row flex-wrap items-center justify-end sm:flex-nowrap">
            <Box title={clearLabel}>
              <IconButton
                onClick={onClear}
                variant="toolbar"
                size="sm"
                rounded="md"
                icon={<Icon name="x" className="h-4 w-4" />}
                label={clearAriaLabel}
              />
            </Box>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
