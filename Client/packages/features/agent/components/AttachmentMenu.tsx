import { useEffect, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
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
  const menuRef = useRef<HTMLDivElement | null>(null);
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
    <Box className="relative">
      <Card
        border="charcoal"
        padding="none"
        hover={false}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
      >
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="text-text-secondary hover:bg-background-base disabled:hover:bg-background-surface flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-sm"
          label={t("agent.add_attachment")}
        >
          <Box
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
          </Box>
        </Button>
      </Card>

      {isOpen && (
        <Box ref={menuRef} className="absolute bottom-full left-0 z-50 mb-2 w-56">
          <Card border="light" padding="none" hover={false} className="overflow-hidden">
            <Box className="px-3 py-2">
              <AttachmentMenuItem
                iconName="home"
                title={t("agent.share_home")}
                onClick={closeAnd(onSelectHome)}
              />
              {onSelectDocument && (
                <AttachmentMenuItem
                  iconName="file-text"
                  title={t("agent.share_document")}
                  onClick={closeAnd(onSelectDocument)}
                />
              )}
              {onSelectAgreement && (
                <AttachmentMenuItem
                  iconName="file-signature"
                  title={t("agent.share_agreement")}
                  onClick={closeAnd(onSelectAgreement)}
                />
              )}
              <AttachmentMenuItem
                iconName="calendar"
                title={t("agent.event_request")}
                onClick={closeAnd(onSelectCalendar)}
              />
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}
