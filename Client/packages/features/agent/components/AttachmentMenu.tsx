import { useEffect, useRef, useState } from "react";

import { Calendar, FileSignature, FileText, Home, X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { BodyText, Button } from "packages/ui/components/index.web";
import { getDocument } from "packages/utils/platform";

import { AttachmentMenuItem } from "./AttachmentMenuItem";

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
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    const doc = getDocument();
    if (isOpen && doc) doc.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (doc) doc.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const closeAnd = (fn: () => void) => () => {
    setIsOpen(false);
    fn();
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-all duration-200 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-200"
        label={t("agent.add_attachment")}
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <BodyText as="span" size="md" className="text-lg font-light leading-none">
            +
          </BodyText>
        )}
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <div className="px-3 py-2">
            <AttachmentMenuItem
              icon={Home}
              title={t("agent.share_home")}
              description={t("agent.share_home_description")}
              onClick={closeAnd(onSelectHome)}
            />
            {onSelectDocument && (
              <AttachmentMenuItem
                icon={FileText}
                title={t("agent.share_document")}
                description={t("agent.share_document_description")}
                onClick={closeAnd(onSelectDocument)}
              />
            )}
            {onSelectAgreement && (
              <AttachmentMenuItem
                icon={FileSignature}
                iconClassName="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50"
                iconColorClass="text-blue-600"
                title={t("agent.share_agreement")}
                description={t("agent.share_agreement_description")}
                onClick={closeAnd(onSelectAgreement)}
              />
            )}
            <AttachmentMenuItem
              icon={Calendar}
              title={t("agent.event_request")}
              description={t("agent.schedule_meeting")}
              onClick={closeAnd(onSelectCalendar)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
