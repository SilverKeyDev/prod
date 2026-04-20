import React from "react";

import { ScrollView } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";

type Option = { value: string; label: string };

type FilterChipRowProps = {
  label: string;
  options: readonly Option[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  className?: string;
};

export function FilterChipRow({
  label,
  options,
  value,
  onChange,
  className = "mb-3",
}: FilterChipRowProps) {
  return (
    <Box className={`flex-row gap-2 ${className}`}>
      <Box className="flex-1">
        <Text className="text-text-secondary mb-1 text-xs">{label}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange(isSelected ? undefined : (opt.value as string))}
                className={`mr-2 rounded-full border px-3 py-1.5 ${
                  isSelected
                    ? "border-border bg-primary-muted"
                    : "border-border bg-background-surface"
                }`}
              >
                <Text className={`text-xs ${isSelected ? "text-primary" : "text-text-primary"}`}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Box>
    </Box>
  );
}
