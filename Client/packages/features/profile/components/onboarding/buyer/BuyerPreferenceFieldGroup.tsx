import React from "react";

import { useLocalization } from "packages/contexts";
import { Label } from "packages/ui";
import { Box, Pressable } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type BuyerOption = { value: string; labelKey: string };

type BuyerRadioGroupProps = {
  options: BuyerOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  name: string;
};

export function BuyerRadioGroup({
  options,
  value,
  onChange,
  disabled = false,
  name,
}: BuyerRadioGroupProps) {
  const { t } = useLocalization();
  return (
    <Box id={name} className="flex flex-row flex-wrap gap-2" role="radiogroup">
      {options.map((opt) => {
        const selected = value === opt.value;
        const optionLabel = t(opt.labelKey);
        return (
          <Pressable
            key={opt.value}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            label={optionLabel}
            disabled={disabled}
            onPress={() => onChange(opt.value)}
            className={`rounded-lg border-2 px-4 py-3 ${
              selected ? "border-primary bg-primary/10" : "border-border bg-background-surface"
            }`}
          >
            <BodyText
              size="sm"
              className={`font-medium ${selected ? "text-primary" : "text-text-secondary"}`}
            >
              {optionLabel}
            </BodyText>
          </Pressable>
        );
      })}
    </Box>
  );
}

type BuyerMultiSelectChipsProps = {
  options: BuyerOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  /** Override default toggle when selection rules are not a simple add/remove. */
  resolveNextValue?: (current: string[], toggledValue: string) => string[];
};

export function BuyerMultiSelectChips({
  options,
  value,
  onChange,
  disabled = false,
  resolveNextValue,
}: BuyerMultiSelectChipsProps) {
  const { t } = useLocalization();
  const toggle = (optValue: string) => {
    if (disabled) return;
    const next = resolveNextValue
      ? resolveNextValue(value, optValue)
      : value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue];
    onChange(next);
  };

  return (
    <Box className="flex flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const optionLabel = t(opt.labelKey);
        return (
          <Pressable
            key={opt.value}
            role="checkbox"
            aria-checked={selected}
            aria-disabled={disabled}
            label={optionLabel}
            disabled={disabled}
            onPress={() => toggle(opt.value)}
            className={`rounded-lg border-2 px-4 py-3 ${
              selected ? "border-primary bg-primary/10" : "border-border bg-background-surface"
            }`}
          >
            <BodyText
              size="sm"
              className={`font-medium ${selected ? "text-primary" : "text-text-secondary"}`}
            >
              {optionLabel}
            </BodyText>
          </Pressable>
        );
      })}
    </Box>
  );
}

type BuyerFieldBlockProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function BuyerFieldBlock({ label, children, className = "" }: BuyerFieldBlockProps) {
  return (
    <Box className={`gap-3 ${className}`}>
      <Label className="text-text-primary mb-0 block text-sm font-semibold">{label}</Label>
      {children}
    </Box>
  );
}
