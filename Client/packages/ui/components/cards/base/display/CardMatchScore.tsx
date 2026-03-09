import { useLocalization } from "packages/contexts";
import { getScoreBasedColor } from "packages/utils";

import { BodyText } from "@/components/ui";

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
  const { t } = useLocalization();

  // Normalize score so getScoreBasedColor never receives NaN/Non-finite
  const safeScore =
    typeof score === "number" && Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
  const safeMaxScore =
    typeof maxScore === "number" && Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100;

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

  const sizeClasses = getSizeClasses();
  const colors = useColorStyling ? getScoreBasedColor(safeScore) : null;

  if (useColorStyling && colors) {
    return (
      <div className={`gap-responsive-xs flex flex-shrink-0 items-center ${className}`}>
        <div
          className={`font-medium ${sizeClasses.text} whitespace-nowrap rounded px-2 py-1`}
          style={{
            backgroundColor: colors.fillColor,
            color: colors.textColor,
          }}
        >
          <BodyText as="span" style={{ color: "inherit" }}>
            {t("house.match_score_value", {
              score: safeScore,
              maxScore: safeMaxScore,
            })}
          </BodyText>
        </div>
      </div>
    );
  }

  return (
    <div className={`gap-responsive-xs text-brown flex flex-shrink-0 items-center ${className}`}>
      <BodyText as="span" className={`font-medium ${sizeClasses.text} whitespace-nowrap`}>
        {t("house.match_score_value", {
          score: safeScore,
          maxScore: safeMaxScore,
        })}
      </BodyText>
    </div>
  );
}
