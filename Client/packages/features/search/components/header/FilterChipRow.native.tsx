import React from "react";

import { Pressable } from "react-native";

import { ScrollView } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

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
        <Text className="mb-1 text-xs text-gray-600">{label}</Text>
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
                  isSelected ? "border-brand-accent bg-brand-accent/10" : "border-gray-300 bg-white"
                }`}
              >
                <Text className={`text-xs ${isSelected ? "text-brand-accent" : "text-gray-700"}`}>
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
