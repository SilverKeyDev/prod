import React from 'react';

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
  className = '',
  icon,
  text,
  colorClasses,
  title,
  hideTextOnMobile = false,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 border touch-friendly disabled:opacity-50 disabled:cursor-not-allowed';

  // Use responsive padding like ViewDetails
  const paddingClasses = text ? 'px-responsive-sm py-responsive-xs' : 'p-responsive-xs';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${paddingClasses} ${colorClasses} ${className}`}
      title={title}
    >
      {React.cloneElement(icon as React.ReactElement, {
        className: 'mobile-icon-xs flex-shrink-0',
      })}
      {text && (
        <span
          className={`btn-text-responsive ml-1 min-w-0 flex-shrink sm:ml-2 ${
            hideTextOnMobile ? 'hidden lg:inline' : ''
          }`}
        >
          {text}
        </span>
      )}
    </button>
  );
};

export default ActionButton;
