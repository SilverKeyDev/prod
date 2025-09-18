import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

import IconButton from '../ui/button/IconButton';

export type BaseModalProps = {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing escape closes modal */
  closeOnEscape?: boolean;
  /** Additional className for modal content */
  className?: string;
  /** Additional className for backdrop */
  backdropClassName?: string;
  /** Children content */
  children: React.ReactNode;
  /** Custom header content */
  headerContent?: React.ReactNode;
  /** Custom footer content */
  footerContent?: React.ReactNode;
  /** Z-index level */
  zIndex?: number;
};

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  backdropClassName = '',
  children,
  headerContent,
  footerContent,
  zIndex = 9999,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Size variants - mobile responsive
  const sizeStyles = {
    xs: 'max-w-xs mx-responsive-sm',
    sm: 'max-w-sm mx-responsive-sm',
    md: 'max-w-md sm:max-w-lg mx-responsive-md',
    lg: 'max-w-lg sm:max-w-xl mx-responsive-md',
    xl: 'max-w-xl sm:max-w-2xl mx-responsive-lg',
    full: 'max-w-full mx-responsive-sm',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex }}>
      <div
        className="flex min-h-screen items-center justify-center p-2 sm:p-4 md:p-6"
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 transition-opacity ${backdropClassName}`}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          className={`relative max-h-[90vh] w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:max-h-[85vh] sm:rounded-xl ${sizeStyles[size]} ${className}`}
        >
          {/* Header */}
          {(title ?? headerContent ?? showCloseButton) && (
            <div className="flex items-center justify-between border-b border-gray-200 p-3 sm:p-4 md:p-6">
              <div className="min-w-0 flex-1">
                {headerContent ??
                  (title && (
                    <h3 className="truncate text-base font-medium text-gray-900 sm:text-lg">
                      {title}
                    </h3>
                  ))}
              </div>
              {showCloseButton && (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X className="h-4 w-4 sm:h-5 sm:w-5" />}
                  onClick={onClose}
                  className="ml-2 flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
                  aria-label="Close modal"
                />
              )}
            </div>
          )}

          {/* Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-3 sm:max-h-[calc(85vh-120px)] sm:p-4 md:p-6">
            {children}
          </div>

          {/* Footer */}
          {footerContent && (
            <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6">{footerContent}</div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BaseModal;
