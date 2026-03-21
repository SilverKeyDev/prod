import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, IconButton } from "@/components/ui";

export type ProfileTagChipProps = {
  /** Label text shown in the chip */
  label: string;
  /** Called when the remove control is activated; if omitted, no remove control is shown */
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  /** Accessible label for the remove button */
  removeLabel?: string;
};

/**
 * Core profile tag chip: selected-tag pill used in "Why are you joining SilverKey?",
 * other requirements, and other multiselect/tag inputs.
 * Shared styling: light outline (border-border), bg-background-surface, rounded-full, optional remove icon.
 */
export function ProfileTagChip({
  label,
  onRemove,
  disabled = false,
  className = "",
  removeLabel,
}: ProfileTagChipProps) {
  const isInteractive = Boolean(onRemove) && !disabled;

  return (
    <Box
      className={`border-border bg-background-surface text-text-primary inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-1.5 shadow-sm ${className}`.trim()}
      role="listitem"
    >
      <BodyText as="span" size="sm" className="font-medium">
        {label}
      </BodyText>
      {isInteractive ? (
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Icon name="x" className="h-3.5 w-3.5" />}
          onClick={onRemove}
          disabled={disabled}
          className="text-text-secondary hover:bg-neutral-100 -mr-0.5 h-6 min-w-0 rounded-full p-0.5 touch-manipulation"
          label={removeLabel ?? `Remove ${label}`}
        />
      ) : null}
    </Box>
  );
}
