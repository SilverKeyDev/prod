import React from 'react';

import KeyTurnLoader from '../../../components/ui/loading/KeyTurnLoader';

type AuthButtonProps = {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
};

export default function AuthButton({
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  children,
  variant = 'primary',
  className = '',
}: AuthButtonProps) {
  const baseClasses =
    'w-full btn-responsive-md font-medium rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-friendly';

  const variantClasses = {
    primary: 'bg-olive hover:bg-olive/90 text-white shadow-sm hover:shadow-md',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300 hover:border-gray-400',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled ?? loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? <KeyTurnLoader message="" /> : children}
    </button>
  );
}
