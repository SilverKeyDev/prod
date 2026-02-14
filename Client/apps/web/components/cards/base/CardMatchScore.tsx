type CardMatchScoreProps = {
  /** Match score (0-100) */
  score: number;
  /** Maximum score (default 100) */
  maxScore?: number;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Use color-based styling */
  useColorStyling?: boolean;
  /** Additional className */
  className?: string;
};

/**
 * Reusable card match score display
 */
export default function CardMatchScore({
  score,
  maxScore = 100,
  size = "sm",
  useColorStyling = false,
  className = "",
}: CardMatchScoreProps) {
  // Add logging for score display debugging

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return {
          text: "text-responsive-xs",
        };
      case "sm":
        return {
          text: "text-responsive-xs",
        };
      case "md":
        return {
          text: "text-responsive-sm",
        };
      default:
        return {
          text: "text-responsive-xs",
        };
    }
  };

  const getScoreBasedColor = (score: number) => {
    const normalizedScore = Math.max(0, Math.min(100, score)) / 100;
    const highColor = { r: 123, g: 158, b: 124 }; // #7B9E7C
    const midColor = { r: 240, g: 233, b: 210 }; // #F0E9D2
    const lowColor = { r: 216, g: 140, b: 140 }; // #D88C8C

    let r: number, g: number, b: number;

    if (normalizedScore >= 0.5) {
      const t = (normalizedScore - 0.5) * 2;
      r = Math.round(midColor.r + (highColor.r - midColor.r) * t);
      g = Math.round(midColor.g + (highColor.g - midColor.g) * t);
      b = Math.round(midColor.b + (highColor.b - midColor.b) * t);
    } else {
      const t = normalizedScore * 2;
      r = Math.round(lowColor.r + (midColor.r - lowColor.r) * t);
      g = Math.round(lowColor.g + (midColor.g - lowColor.g) * t);
      b = Math.round(lowColor.b + (midColor.b - lowColor.b) * t);
    }

    const fillColor = `rgb(${r}, ${g}, ${b})`;
    const strokeColor = `rgb(${Math.round(r * 0.75)}, ${Math.round(
      g * 0.75,
    )}, ${Math.round(b * 0.75)})`;
    return { fillColor, strokeColor };
  };

  const sizeClasses = getSizeClasses();
  const colors = useColorStyling ? getScoreBasedColor(score) : null;

  if (useColorStyling && colors) {
    return (
      <div
        className={`gap-responsive-xs flex flex-shrink-0 items-center ${className}`}
      >
        <span
          className={`font-medium ${sizeClasses.text} whitespace-nowrap rounded px-2 py-1`}
          style={{
            backgroundColor: colors.fillColor,
            color: colors.strokeColor,
          }}
        >
          {score}/{maxScore}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`gap-responsive-xs flex flex-shrink-0 items-center text-brown ${className}`}
    >
      <span className={`font-medium ${sizeClasses.text} whitespace-nowrap`}>
        {score}/{maxScore}
      </span>
    </div>
  );
}
