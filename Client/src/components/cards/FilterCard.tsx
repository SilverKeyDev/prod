import React from "react";
import { Card } from "../ui/base";

export interface FilterCardProps {
  label: string;
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const FilterCard: React.FC<FilterCardProps> = ({
  label,
  value,
  isActive = false,
  onClick,
  className = ""
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isActive 
          ? "ring-2 ring-brown bg-brown/5 border-brown" 
          : "hover:border-brown/50 hover:bg-brown/5"
      } ${className}`}
      padding="sm"
      hover={!isActive}
      onClick={onClick}
    >
      <div className="text-center">
        <p className="text-xs text-gray-600 mb-1">{label}</p>
        <p className={`text-sm font-medium ${
          isActive ? "text-brown" : "text-gray-900"
        }`}>
          {value}
        </p>
      </div>
    </Card>
  );
};

export default FilterCard;
