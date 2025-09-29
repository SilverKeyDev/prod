import React from "react";

type UnderlineButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  className?: string;
};

const UnderlineButton: React.FC<UnderlineButtonProps> = ({
  children,
  onClick,
  title,
  className = "",
}) => {
  return (
    <button
      className={`relative cursor-pointer px-2 py-1 text-lg font-semibold text-neutral-400 underline decoration-neutral-400 decoration-1 underline-offset-[4px] hover:text-neutral-600 hover:decoration-neutral-600 ${className}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default UnderlineButton;
