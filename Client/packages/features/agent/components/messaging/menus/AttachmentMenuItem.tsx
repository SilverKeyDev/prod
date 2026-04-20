import { Icon } from "@ui/icons";

import type { IconName } from "packages/ui/types/icons";

import { BodyText, Button } from "@/components/ui";
type AttachmentMenuItemProps = {
  iconName: IconName;
  iconClassName?: string;
  iconColorClass?: string;
  title: string;
  onClick: () => void;
};
export function AttachmentMenuItem({
  iconName,
  iconClassName = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-muted",
  iconColorClass = "text-text-secondary",
  title,
  onClick,
}: AttachmentMenuItemProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      contentAlign="start"
      onClick={onClick}
      className="text-text-secondary hover:bg-background-base flex w-full items-center justify-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors"
    >
      <BodyText as="span" className={iconClassName}>
        <Icon name={iconName} className={`h-4 w-4 ${iconColorClass}`} />
      </BodyText>
      <BodyText as="span" className="min-w-0 flex-1 font-medium">
        {title}
      </BodyText>
    </Button>
  );
}
