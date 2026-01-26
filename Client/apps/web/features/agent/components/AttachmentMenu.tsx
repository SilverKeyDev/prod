import { Calendar, Home, FileText, FileSignature, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type AttachmentMenuProps = {
  onSelectHome: () => void;
  onSelectCalendar: () => void;
  onSelectDocument?: () => void;
  onSelectAgreement?: () => void;
  disabled?: boolean;
};

export default function AttachmentMenu({
  onSelectHome,
  onSelectCalendar,
  onSelectDocument,
  onSelectAgreement,
  disabled = false,
}: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectHome = () => {
    setIsOpen(false);
    onSelectHome();
  };

  const handleSelectCalendar = () => {
    setIsOpen(false);
    onSelectCalendar();
  };

  const handleSelectDocument = () => {
    setIsOpen(false);
    onSelectDocument?.();
  };

  const handleSelectAgreement = () => {
    setIsOpen(false);
    onSelectAgreement?.();
  };

  return (
    <div className="relative">
      {/* iMessage-style '+' button */}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all duration-200 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-200"
        aria-label="Add attachment"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <span className="text-lg font-light leading-none">+</span>
        )}
      </button>

      {/* Attachment options menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
        >
          <div className="py-1">
            <button
              onClick={handleSelectHome}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                <Home className="h-4 w-4 text-brown" />
              </div>
              <div>
                <div className="font-medium">Share Home</div>
                <div className="text-xs text-gray-500">
                  Send a property listing
                </div>
              </div>
            </button>

            {onSelectDocument && (
              <button
                onClick={handleSelectDocument}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                  <FileText className="h-4 w-4 text-brown" />
                </div>
                <div>
                  <div className="font-medium">Share Document</div>
                  <div className="text-xs text-gray-500">
                    Send a document
                  </div>
                </div>
              </button>
            )}

            {onSelectAgreement && (
              <button
                onClick={handleSelectAgreement}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <FileSignature className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Share Agreement</div>
                  <div className="text-xs text-gray-500">
                    Send a DocuSign agreement
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleSelectCalendar}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
                <Calendar className="h-4 w-4 text-brown" />
              </div>
              <div>
                <div className="font-medium">Event Request</div>
                <div className="text-xs text-gray-500">
                  Schedule a meeting
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

