import React from 'react';
import { Plus, X } from 'lucide-react';

interface OnboardPersonalizeTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

const OnboardPersonalizeTagInput: React.FC<OnboardPersonalizeTagInputProps> = ({
  value = [],
  onChange,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const [draftText, setDraftText] = React.useState("");

  const handleAddTag = (tagValue: string) => {
    if (!tagValue.trim()) return;
    
    // Auto-capitalize: first letter of each word uppercase, rest lowercase
    const capitalizedValue = tagValue
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
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
      {/* Input container with same styling as OnboardPersonalizeDropdown */}
      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={draftText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className={`
            flex-1 h-12 px-4 border border-beige rounded-lg
            bg-white text-gray-600 text-xs sm:text-sm md:text-base text-left leading-tight
            focus:outline-none focus:ring-2 focus:ring-brown/20 focus:border-brown
            hover:border-brown/50 disabled:cursor-not-allowed
            transition-all duration-200
            disabled:bg-gray-50 disabled:text-gray-400
            mobile-input
            placeholder:text-gray-400
          `}
          placeholder={placeholder}
        />
        {/* Square olive plus button with centered icon */}
        <button
          type="button"
          onClick={() => handleAddTag(draftText)}
          disabled={disabled || !draftText.trim()}
          className={`
            w-12 h-12 bg-olive text-white rounded-lg
            hover:bg-olive/80 disabled:bg-olive/50
            transition-colors duration-200 touch-friendly
            flex items-center justify-center
            disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-olive/20
          `}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige text-black"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                className="ml-2 text-black/60 hover:text-black disabled:cursor-not-allowed disabled:text-black/30"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardPersonalizeTagInput;
