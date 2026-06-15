import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import { UnderlineTabs } from "packages/ui/components/structure/tabs/UnderlineTabs";

type SavedPageViewUnderlineTabsProps = {
  isAgent: boolean;
  viewType: SavedPageViewType;
  onViewTypeChange: (type: SavedPageViewType) => void;
  className?: string;
};

export function SavedPageViewUnderlineTabs({
  isAgent,
  viewType,
  onViewTypeChange,
  className = "mb-3",
}: SavedPageViewUnderlineTabsProps): JSX.Element {
  const { t } = useLocalization();
  const items = isAgent
    ? [
        { id: "documents" as const, label: t("saved.tab_documents") },
        { id: "forms-library" as const, label: t("saved.tab_forms_library") },
        {
          id: "agreements" as const,
          label: t("saved.tab_agreements", { defaultValue: "DocuSign" }),
        },
      ]
    : [
        { id: "documents" as const, label: t("saved.tab_documents") },
        {
          id: "agreements" as const,
          label: t("saved.tab_agreements", { defaultValue: "DocuSign" }),
        },
      ];
  return (
    <UnderlineTabs
      items={items}
      activeId={viewType}
      onChange={(id) => onViewTypeChange(id as SavedPageViewType)}
      size="md"
      scrollable
      className={className}
    />
  );
}
