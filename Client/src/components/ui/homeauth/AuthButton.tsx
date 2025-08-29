import React from "react";

interface AuthButtonProps {
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export default function AuthButton({
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  children,
  variant = "primary",
  className = "",
}: AuthButtonProps) {
  const baseClasses = "w-full btn-responsive-md font-medium rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-friendly";
  
  const variantClasses = {
    primary: "bg-olive hover:bg-olive/90 text-white shadow-sm hover:shadow-md",
    secondary: "bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 hover:border-gray-400"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin"
            width="24"
            height="24"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Key head */}
            <circle cx="20" cy="32" r="8" stroke="#F5F5DC" strokeWidth="4" fill="#F5F5DC" />
            {/* Shaft */}
            <rect x="28" y="30" width="24" height="4" fill="#F5F5DC" rx="2" />
            {/* Teeth */}
            <rect x="52" y="30" width="4" height="8" fill="#F5F5DC" rx="1" />
            <rect x="56" y="30" width="4" height="6" fill="#F5F5DC" rx="1" />
          </svg>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
