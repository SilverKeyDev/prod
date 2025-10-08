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
  const calculateOptimalSize = () => {
    const contentCount = [
      bedrooms,
      bathrooms,
      hideSquareFootage ? undefined : sqft,
    ].filter((val) => val !== undefined && Number(val) > 0).length;

    // Aggressive scaling - prioritize fitting everything in one line
    if (contentCount >= 3) return "xs"; // All three items - smallest
    if (contentCount === 2) return "sm"; // Two items - medium
    return "lg"; // Single item - can be largest
  };

  const optimalSize = calculateOptimalSize();

  // Size variants optimized for single-line fit with 1px margins and text scaling
  const sizeStyles = {
    xs: {
      text: "text-[10px] sm:text-xs", // Very small text for tight fit
      icon: "w-2.5 h-2.5 sm:w-3 sm:h-3",
      gap: "gap-0.5 sm:gap-1",
      spacing: "px-[1px]", // 1px margin on each side
    },
    sm: {
      text: "text-xs sm:text-sm", // Small text for medium fit
      icon: "w-3 h-3 sm:w-3.5 sm:h-3.5",
      gap: "gap-1 sm:gap-1.5",
      spacing: "px-[1px]", // 1px margin on each side
    },
    md: {
      text: "text-sm sm:text-base", // Medium text for comfortable fit
      icon: "w-3.5 h-3.5 sm:w-4 sm:h-4",
      gap: "gap-1.5 sm:gap-2",
      spacing: "px-[1px]", // 1px margin on each side
    },
    lg: {
      text: "text-base sm:text-lg", // Larger text for single item
      icon: "w-4 h-4 sm:w-5 sm:h-5",
      gap: "gap-2 sm:gap-2.5",
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
      {/* First row: bedrooms and bathrooms */}
      <div className="flex items-center justify-center flex-nowrap gap-1 sm:gap-1.5">
        {bedrooms !== undefined && Number(bedrooms) > 0 && (
          <div className="flex flex-shrink-0 items-center">
            {showIcons && (
              <Bed
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0 text-brown`}
              />
            )}

            {variant === "modal"
              ? bedrooms
              : `${bedrooms} bed${bedrooms !== 1 ? "s" : ""}`}
          </div>
        )}

        {bathrooms !== undefined && Number(bathrooms) > 0 && (
          <div className="flex flex-shrink-0 items-center">
            {showIcons && (
              <Bath
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0 text-brown`}
              />
            )}

            {variant === "modal"
              ? bathrooms
              : `${bathrooms} bath${bathrooms !== 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      {/* Second row: square footage (always present to maintain spacing) */}
      <div className="flex flex-shrink-0 items-center justify-center">
        {sqft && Number(sqft) > 0 && !hideSquareFootage ? (
          <>
            {variant === "modal" ? (
              <div className="text-center">
                <div
                  className={`font-bold ${currentSizeStyles.text} text-gray-600`}
                >
                  {Math.round(Number(sqft)).toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-gray-600">Sq Ft</div>
              </div>
            ) : (
              <>
                {showIcons && (
                  <Square
                    className={`${currentSizeStyles.icon} mr-1 flex-shrink-0 text-brown`}
                  />
                )}
                {Math.round(Number(sqft)).toLocaleString()} sqft
              </>
            )}
          </>
        ) : (
          /* Invisible placeholder to maintain spacing */
          <div className="invisible">
            {showIcons && (
              <Square
                className={`${currentSizeStyles.icon} mr-1 flex-shrink-0 text-brown`}
              />
            )}
            <span className={currentSizeStyles.text}>0 sqft</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPropertyDetails;
