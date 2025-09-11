import { ArrowDownRight } from "lucide-react";

interface CardPriceDropProps {
  /** Old price */
  oldPrice: number;
  /** New price */
  newPrice: number;
  /** Currency (default USD) */
  currency?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Additional className */
  className?: string;
}

/**
 * Reusable card price drop display with arrow icon and percentage
 */
export default function CardPriceDrop({
  oldPrice,
  newPrice,
  currency = "USD",
  size = "sm",
  className = "",
}: CardPriceDropProps) {
  const percent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  });

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return {
          icon: "mobile-icon-xs",
          text: "text-responsive-xs",
        };
      case "sm":
        return {
          icon: "mobile-icon-sm",
          text: "text-responsive-xs",
        };
      case "md":
        return {
          icon: "mobile-icon-md",
          text: "text-responsive-sm",
        };
      default:
        return {
          icon: "mobile-icon-sm",
          text: "text-responsive-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        className={`flex items-center gap-responsive-xs ${sizeClasses.text} text-red-600 font-medium`}
      >
        <ArrowDownRight className={`${sizeClasses.icon} flex-shrink-0`} />
        <span className="whitespace-nowrap">{percent}% price drop</span>
      </div>
      <p className={`${sizeClasses.text} text-gray-700 truncate`}>
        {formatter.format(oldPrice)} → {formatter.format(newPrice)}
      </p>
    </div>
  );
}
