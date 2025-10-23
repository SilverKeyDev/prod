import { Plus, X } from "lucide-react";
import React from "react";

import { Input } from "../../components/ui";

type OnPerTagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
};

const OnPerTagInput: React.FC<OnPerTagInputProps> = ({
  value = [],
  onChange,
  placeholder,
  className = "",
  disabled = false,
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
    <div className={`${className}`}>
      {/* Input container with same styling as OnPerDropdown */}
      <div className="mb-3 flex space-x-2">
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
        <button
          type="button"
          onClick={() => handleAddTag(draftText)}
          disabled={disabled ?? !draftText.trim()}
          className={`touch-friendly flex h-12 w-12 items-center justify-center rounded-lg bg-olive text-white transition-colors duration-200 hover:bg-olive/80 focus:outline-none focus:ring-2 focus:ring-olive/20 disabled:cursor-not-allowed disabled:bg-olive/50`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center rounded-full bg-gold px-3 py-1 text-sm text-off-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                className="ml-2 text-off-white/60 hover:text-off-white disabled:cursor-not-allowed disabled:text-off-white/30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnPerTagInput;
