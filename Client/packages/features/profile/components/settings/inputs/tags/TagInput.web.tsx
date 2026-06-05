import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

import { Button, Input } from "@/components/ui";
import { ProfileTagChip } from "@/features/profile/components/ProfileTagChip";
import { PROFILE_NOT_SPECIFIED_LABEL } from "@/features/profile/utils";

type OnPerTagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  isEditMode?: boolean;
};
const OnPerTagInput: React.FC<OnPerTagInputProps> = ({
  value = [],
  onChange,
  placeholder,
  className = "",
  disabled = false,
  isEditMode = true,
}) => {
  const [draftText, setDraftText] = React.useState("");
  const handleAddTag = (tagValue: string) => {
    if (!tagValue.trim()) return;
    // Auto-capitalize: first letter of each word uppercase, rest lowercase
    const capitalizedValue = tagValue
      .trim()
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    if (!value.includes(capitalizedValue)) {
      onChange([...value, capitalizedValue]);
    }
    setDraftText("");
  };
  const handleRemoveTag = (valueToRemove: string) => {
    onChange(value.filter((item) => item !== valueToRemove));
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(draftText);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftText(e.target.value);
  };
  return (
    <Box className={`${className}`}>
      {/* Input container with same styling as OnPerDropdown - only show in edit mode */}
      {isEditMode && (
        <Box className="mb-3 flex space-x-2">
          <Input
            type="text"
            value={draftText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1"
            variant="default"
            size="md"
          />
          {/* Square olive plus button with centered icon */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => handleAddTag(draftText)}
            disabled={disabled ?? !draftText.trim()}
            iconName="plus"
            className="touch-friendly h-12 w-12 min-w-0 p-0"
          />
        </Box>
      )}

      {/* Tags display - same chip style as "Why are you joining SilverKey?" */}
      {value.length > 0 && (
        <Box className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <ProfileTagChip
              key={index}
              label={tag}
              onRemove={isEditMode && !disabled ? () => handleRemoveTag(tag) : undefined}
              disabled={disabled}
              removeLabel={`Remove ${tag}`}
            />
          ))}
        </Box>
      )}

      {/* Read-only empty state */}
      {!isEditMode && value.length === 0 && (
        <Box className="border-border bg-background-base text-text-secondary rounded-lg border px-4 py-3 text-sm">
          {PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      )}
    </Box>
  );
};
export default OnPerTagInput;
