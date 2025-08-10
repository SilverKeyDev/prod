import React from "react";
import { Heart } from "lucide-react";

interface HeartSaveProps {
  /** The property object to save/remove */
  property: {
    id: string;
    address: string;
    [key: string]: any;
  };
  /** Whether the property is currently saved */
  isSaved: boolean;
  /** Function to save the property */
  onSave: (property: any) => void | Promise<void>;
  /** Function to remove the property */
  onRemove: (propertyId: string) => void | Promise<void>;
  /** Size of the heart icon */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

const HeartSave: React.FC<HeartSaveProps> = ({
  property,
  isSaved,
  onSave,
  onRemove,
  size = "md",
  className = "",
  ariaLabel,
}) => {
  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isSaved) {
      await onRemove(property.id);
    } else {
      await onSave(property);
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2"
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full transition-colors ${
        isSaved
          ? "text-red-500 hover:text-red-600"
          : "text-gray-400 hover:text-red-500"
      } ${buttonSizeClasses[size]} ${className}`}
      aria-label={
        ariaLabel || 
        (isSaved ? "Remove from saved homes" : "Save to favorites")
      }
      title={isSaved ? "Remove from saved homes" : "Save to favorites"}
    >
      <Heart
        className={`${sizeClasses[size]} ${
          isSaved ? "fill-current" : ""
        }`}
      />
    </button>
  );
};

export default HeartSave;
