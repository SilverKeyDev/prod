import { useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import { getDocument } from "packages/utils/platform";

import { BodyText, Button } from "@/components/ui";

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
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition-all duration-200 ease-out hover:bg-gray-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-sm"
        label={t("agent.add_attachment")}
      >
        <div
          className={`transition-transform duration-200 ease-out ${isOpen ? "rotate-45" : "rotate-0"}`}
        >
          {isOpen ? (
            <BodyText as="span" size="md" className="text-lg font-light leading-none">
              +
            </BodyText>
          ) : (
            <BodyText as="span" size="md" className="text-lg font-light leading-none">
              +
            </BodyText>
          )}
        </div>
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          <div className="px-3 py-2">
            <AttachmentMenuItem
              iconName="home"
              title={t("agent.share_home")}
              description={t("agent.share_home_description")}
              onClick={closeAnd(onSelectHome)}
            />
            {onSelectDocument && (
              <AttachmentMenuItem
                iconName="file-text"
                title={t("agent.share_document")}
                description={t("agent.share_document_description")}
                onClick={closeAnd(onSelectDocument)}
              />
            )}
            {onSelectAgreement && (
              <AttachmentMenuItem
                iconName="file-signature"
                iconClassName="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50"
                iconColorClass="text-blue-600"
                title={t("agent.share_agreement")}
                description={t("agent.share_agreement_description")}
                onClick={closeAnd(onSelectAgreement)}
              />
            )}
            <AttachmentMenuItem
              iconName="calendar"
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
