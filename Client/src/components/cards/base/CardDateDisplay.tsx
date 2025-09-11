import { Calendar } from "lucide-react";

interface CardDateDisplayProps {
  /** Date string or Date object */
  date: string | Date | null;
  /** Label prefix (e.g., "Created", "Listed on") */
  label?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
  /** Additional className */
  className?: string;
}

/**
 * Reusable card date display with calendar icon and formatted date
 */
export default function CardDateDisplay({
  date,
  label = "Created",
  size = "xs",
  className = "",
}: CardDateDisplayProps) {
  const formatDate = (dateInput: string | Date | null): string => {
    if (!dateInput) return "Unknown";

    const dateObj =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          text: "text-responsive-sm",
        };
      case "md":
        return {
          icon: "mobile-icon-md",
          text: "text-responsive-base",
        };
      default:
        return {
          icon: "mobile-icon-xs",
          text: "text-responsive-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex items-center gap-responsive-sm ${className}`}>
      <Calendar
        className={`${sizeClasses.icon} text-neutral-400 flex-shrink-0`}
      />
      <p className={`${sizeClasses.text} text-neutral-600`}>
        {label} {formatDate(date)}
      </p>
    </div>
  );
}
