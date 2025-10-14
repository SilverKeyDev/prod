import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
}

export default function RefreshButton({
  onClick,
  disabled = false,
  loading = false,
  title = "Refresh",
  className = "",
  size = "md",
  variant = "default",
}: RefreshButtonProps) {
  const isDisabled = disabled || loading;

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8 px-2",
    md: "h-10 w-10 px-3 py-2.5",
    lg: "h-12 w-12 px-4 py-3",
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Variant classes
  const variantClasses = {
    default: isDisabled
      ? "cursor-not-allowed bg-gray-300 text-gray-600"
      : "bg-gray-300 text-gray-600 hover:bg-gray-500 hover:text-white",
    outline: isDisabled
      ? "cursor-not-allowed border-gray-300 bg-white text-gray-400"
      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
    ghost: isDisabled
      ? "cursor-not-allowed text-gray-400 hover:bg-transparent"
      : "text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        touch-friendly flex shrink-0 items-center justify-center rounded transition-colors duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      title={loading ? "Refreshing..." : title}
    >
      <RefreshCw
        className={`${iconSizeClasses[size]} transition-transform duration-200 ${
          loading ? "animate-spin" : ""
        }`}
      />
    </button>
  );
}
