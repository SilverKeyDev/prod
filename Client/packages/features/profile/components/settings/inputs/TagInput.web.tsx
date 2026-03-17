import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { Button, Input } from "@/components/ui";

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

      {/* Tags display */}
      {value.length > 0 && (
        <Box className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Box
              key={index}
              className="bg-accent text-off-white inline-flex items-center rounded-full px-3 py-1 text-sm"
            >
              {tag}
              {isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={disabled}
                  className="text-off-white hover:text-off-white ml-4 h-auto min-w-0 p-0 hover:bg-transparent disabled:opacity-60"
                >
                  <Icon name="x" className="h-3 w-3 text-current" />
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
export default OnPerTagInput;
