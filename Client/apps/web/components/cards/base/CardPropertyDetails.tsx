import { Bed, Bath, Square } from "lucide-react";
import React from "react";

export type CardPropertyDetailsProps = {
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Square footage */
  sqft?: number;
  /** Lot size */
  lotSize?: string;
  /** Display variant */
  variant?: "horizontal" | "vertical" | "grid" | "modal";
  /** Whether to show icons */
  showIcons?: boolean;
  /** Whether to hide square footage */
  hideSquareFootage?: boolean;
  /** Additional className */
  className?: string;
};

const CardPropertyDetails: React.FC<CardPropertyDetailsProps> = ({
  bedrooms,
  bathrooms,
  sqft,
  lotSize,
  variant = "horizontal",
  showIcons = true,
  hideSquareFootage = false,
  className = "",
}) => {
  // Dynamic size calculation based on content length for optimal single-line fit
  // Only move sqft to second level if it would cause overflow (within 10px of edge)
  const hasSqft = !hideSquareFootage; // Always show sqft unless explicitly hidden
  const contentCount = [bedrooms, bathrooms].filter(
    (val) => val !== undefined && Number(val) > 0
  ).length;
  const shouldMoveSqftToSecondRow = hasSqft && contentCount >= 2; // Move to second row if 2+ items + sqft

  const calculateOptimalSize = () => {
    // Scale based on bedrooms/bathrooms only, sqft goes to second level if needed
    if (contentCount >= 2) return "sm"; // Two items - medium
    return "md"; // Single item - comfortable size
  };

  const optimalSize = calculateOptimalSize();

  // Size variants with smaller icons and light gray styling
  const sizeStyles = {
    sm: {
      text: "text-xs sm:text-sm text-gray-500", // Small text with light gray
      icon: "w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400", // Smaller icons with light gray
      gap: "gap-1 sm:gap-1.5",
      spacing: "px-[1px]", // 1px margin on each side
    },
    md: {
      text: "text-sm sm:text-base text-gray-500", // Medium text with light gray
      icon: "w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400", // Smaller icons with light gray
      gap: "gap-1.5 sm:gap-2",
      spacing: "px-[1px]", // 1px margin on each side
    },
  };

  // Two-row layout: bedrooms/bathrooms on top, sqft on bottom
  const layoutStyles = {
    horizontal: "flex flex-col items-center justify-center",
    vertical: "flex flex-col items-center justify-center",
    grid: "flex flex-col items-center justify-center",
    modal: "flex flex-col items-center justify-center",
  };

  const currentSizeStyles = sizeStyles[optimalSize];
  const currentLayoutStyles = layoutStyles[variant];

  const containerClasses = [
    currentLayoutStyles,
    currentSizeStyles.gap,
    currentSizeStyles.spacing,
    "w-full min-w-0", // Ensure full width for centering and prevent overflow
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    bedrooms === undefined &&
    bathrooms === undefined &&
    sqft === undefined &&
    !lotSize
  )
    return null;

  return (
    <div className={containerClasses}>
      {/* First row: bedrooms, bathrooms, and optionally sqft */}
      <div className="flex items-center justify-center flex-nowrap gap-1 sm:gap-1.5">
        {bedrooms !== undefined && Number(bedrooms) > 0 && (
          <div
            className={`flex flex-shrink-0 items-center ${currentSizeStyles.text}`}
          >
            {showIcons && (
              <Bed className={`${currentSizeStyles.icon} mr-1 flex-shrink-0`} />
            )}

            {variant === "modal"
              ? bedrooms
              : `${bedrooms} bed${bedrooms !== 1 ? "s" : ""}`}
          </div>
        )}

        {bathrooms !== undefined && Number(bathrooms) > 0 && (
          <div
            className={`flex flex-shrink-0 items-center ${currentSizeStyles.text}`}
          >
            {showIcons && (
              <Bath
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0`}
              />
            )}

            {variant === "modal"
              ? bathrooms
              : `${bathrooms} bath${bathrooms !== 1 ? "s" : ""}`}
          </div>
        )}

        {/* Sqft on same line if it fits, otherwise it goes to second row */}
        {hasSqft && !shouldMoveSqftToSecondRow && (
          <div
            className={`flex flex-shrink-0 items-center ${currentSizeStyles.text}`}
          >
            {showIcons && (
              <Square
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0`}
              />
            )}
            <span>
              {sqft === undefined || Number(sqft) <= 0
                ? "n/a sqft"
                : `${Math.round(Number(sqft)).toLocaleString()} sqft`}
            </span>
          </div>
        )}
      </div>

      {/* Second row: square footage (only if moved here for spacing) */}
      {shouldMoveSqftToSecondRow && (
        <div className="flex flex-shrink-0 items-center justify-center">
          <div
            className={`flex flex-shrink-0 items-center ${currentSizeStyles.text}`}
          >
            {showIcons && (
              <Square
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0`}
              />
            )}
            <span>
              {sqft === undefined || Number(sqft) <= 0
                ? "n/a sqft"
                : `${Math.round(Number(sqft)).toLocaleString()} sqft`}
            </span>
          </div>
        </div>
      )}

      {/* Modal variant handling */}
      {variant === "modal" && hasSqft && (
        <div className="text-center">
          <div className={`font-bold text-gray-500`}>
            {sqft === undefined || Number(sqft) <= 0
              ? "n/a"
              : Math.round(Number(sqft)).toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-gray-500">Sq Ft</div>
        </div>
      )}
    </div>
  );
};

export default CardPropertyDetails;
