import React from "react";

type ActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon: React.ReactNode;
  text?: string; // Made optional
  colorClasses: string; // e.g., "bg-brown hover:bg-brown/90 text-white"
  title?: string;
  hideTextOnMobile?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
  icon,
  text,
  colorClasses,
  title,
  hideTextOnMobile = true, // Default to hiding text on mobile for better UX
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  // Use responsive padding - smaller on mobile, larger on desktop
  const paddingClasses = text
    ? "px-2 py-1.5 sm:px-responsive-sm sm:py-responsive-xs"
    : "p-1.5 sm:p-responsive-xs";

  // Handler to blur button after click to prevent stuck hover state
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick();
    // Store reference to button element before async operation
    const buttonElement = e.currentTarget;
    // Blur the button after click to prevent hover state from persisting
    setTimeout(() => {
      if (buttonElement) {
        buttonElement.blur();
      }
    }, 0);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClasses} ${paddingClasses} ${colorClasses} ${className}`}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
      })}
      {text && (
        <span
          className={`text-responsive-xs ml-1 min-w-0 flex-shrink sm:ml-2 ${
            hideTextOnMobile ? "hidden md:inline" : ""
          }`}
        >
          {text}
        </span>
      )}
    </button>
  );
};

export default ActionButton;
