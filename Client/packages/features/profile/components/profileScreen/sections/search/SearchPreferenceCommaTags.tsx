import React from "react";

import { Input } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { PROFILE_NOT_SPECIFIED_LABEL } from "@/features/profile/utils";
import { profileFieldValueClassName } from "@/features/profile/utils";

export type SearchPreferenceCommaTagsProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  isEditMode: boolean;
};

function parseCommaTags(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Default (e.g. React Native): comma-separated tags in one field. */
export function SearchPreferenceCommaTags({
  value,
  onChange,
  placeholder,
  isEditMode,
}: SearchPreferenceCommaTagsProps) {
  const joined = value.length > 0 ? value.join(", ") : "";

  if (!isEditMode) {
    return (
      <Box
        className={`mobile-input bg-background-base ${profileFieldValueClassName(
          joined || undefined
        )}`}
      >
        {joined ? (
          <BodyText size="sm">{joined}</BodyText>
        ) : (
          <BodyText size="sm" muted>
            {PROFILE_NOT_SPECIFIED_LABEL}
          </BodyText>
        )}
      </Box>
    );
  }

  return (
    <Input
      type="text"
      value={joined}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(parseCommaTags(e.target.value))
      }
      placeholder={placeholder}
    />
  );
}
