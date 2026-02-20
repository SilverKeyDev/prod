import type { LucideIcon } from "lucide-react";

import { BodyText, Button } from "@/components/ui/index.web";

type AttachmentMenuItemProps = {
  icon: LucideIcon;
  iconClassName?: string;
  iconColorClass?: string;
  title: string;
  description: string;
  onClick: () => void;
};

export function AttachmentMenuItem({
  icon: Icon,
  iconClassName = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20",
  iconColorClass = "text-brown",
  title,
  description,
  onClick,
}: AttachmentMenuItemProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      <BodyText as="span" className={iconClassName}>
        <Icon className={`h-4 w-4 ${iconColorClass}`} />
      </BodyText>
      <BodyText as="span" className="min-w-0 flex-1 text-left">
        <BodyText as="span" className="font-medium">
          {title}
        </BodyText>
        <BodyText as="span" className="block text-xs text-gray-500">
          {description}
        </BodyText>
      </BodyText>
    </Button>
  );
}
