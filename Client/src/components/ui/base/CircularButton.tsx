import React from "react";

interface UnderlineButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  className?: string;
}

const UnderlineButton: React.FC<UnderlineButtonProps> = ({
  children,
  onClick,
  title,
  className = "",
}) => {
  return (
    <button
      className={`relative text-lg font-semibold
        text-neutral-400 underline decoration-neutral-400 decoration-1 underline-offset-[4px]
        hover:text-brand-accent hover:decoration-brand-accent
        transition-colors duration-300 cursor-pointer px-2 py-1
        /* accent sweep underline */
        after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[1.5px] after:w-full
        after:bg-neutral-400 after:scale-x-0 after:origin-left
        motion-safe:after:transition-transform motion-safe:after:duration-300
        hover:after:scale-x-100 hover:after:bg-brand-accent
        ${className}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default UnderlineButton;
