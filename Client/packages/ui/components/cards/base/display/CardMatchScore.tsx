import { useLocalization } from "packages/contexts";
import { formatMatchScoreDisplayPercent } from "packages/utils/format/matchScore";
import { MatchPill } from "packages/ui/components/match/MatchPill";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type CardMatchScoreProps = {
  /** Match score (0-100) */
  score: number;
  /** Maximum score (default 100) */
  maxScore?: number;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Use tiered match pill (score + label) */
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

  const displayPercent = formatMatchScoreDisplayPercent(score, maxScore);

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

  const valueNode = useColorStyling ? (
    <MatchPill score={displayPercent} className={`font-medium ${sizeClasses.text}`} />
  ) : (
    <BodyText as="span" className={`font-medium ${sizeClasses.text} whitespace-nowrap`}>
      {t("house.match_score_value", {
        percent: displayPercent,
      })}
    </BodyText>
  );

  if (useColorStyling) {
    return (
      <Box className={`gap-responsive-xs flex flex-shrink-0 items-center ${className}`}>
        {valueNode}
      </Box>
    );
  }

  return (
    <Box className={`gap-responsive-xs text-brown flex flex-shrink-0 items-center ${className}`}>
      {valueNode}
    </Box>
  );
}
