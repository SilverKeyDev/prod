import { useLocalization } from "packages/contexts";

import { BodyText } from "@/components/ui/index.web";
import { UnderlineTabs } from "@/components/ui/tabs/index.web";

export function Tabs(props: {
  active: "results" | "saved";
  onChange: (tab: "results" | "saved") => void;
  counts: { results: number; saved: number };
  compact?: boolean;
}): JSX.Element {
  const { t } = useLocalization();
  const { active, onChange, counts, compact = false } = props;

  const items = [
    { id: "results" as const, label: t("search.search_tab") },
    {
      id: "saved" as const,
      label: (
        <div className="flex items-center gap-2">
          {t("search.saved_tab")}
          <BodyText
            as="span"
            size="xs"
            className="ml-1 rounded-full bg-olive px-2 py-1 text-white"
          >
            {counts.saved}
          </BodyText>
        </div>
      ),
    },
  ];

  return (
    <UnderlineTabs
      items={items}
      activeId={active}
      onChange={(id) => onChange(id as "results" | "saved")}
      compact={compact}
      className={compact ? "" : "mb-4"}
    />
  );
}
