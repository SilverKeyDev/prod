import React from "react";

import { Icon } from "@ui/icons";

import IconButton from "packages/ui/components/actions/button/IconButton";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type TagChipProps = {
  label: string;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  removeLabel?: string;
};

export function TagChip({
  label,
  onRemove,
  disabled = false,
  className = "",
  removeLabel,
}: TagChipProps) {
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
          className="text-text-secondary -mr-0.5 h-6 min-w-0 touch-manipulation rounded-full p-0.5 hover:bg-neutral-100"
          label={removeLabel ?? `Remove ${label}`}
        />
      ) : null}
    </Box>
  );
}
