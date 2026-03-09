import React from "react";

import { useLocalization } from "packages/contexts";

import { BodyText, Button } from "@/components/ui";

const SALE_TYPE_OPTIONS = [
  { value: "", labelKey: "search.sale_type_all" as const },
  { value: "FOR_SALE", labelKey: "search.sale_type_for_sale" as const },
  { value: "PENDING", labelKey: "search.sale_type_pending" as const },
  { value: "SOLD", labelKey: "search.sale_type_sold" as const },
] as const;

export type SaleTypeValue = (typeof SALE_TYPE_OPTIONS)[number]["value"];

export type SaleTypeFilterProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function SaleTypeFilter({
  value,
  onChange,
  disabled = false,
  className = "",
}: SaleTypeFilterProps): React.ReactElement {
  const { t } = useLocalization();
  const selected = value ?? "";

  return (
    <div className={className}>
      <BodyText size="sm" className="mb-2 font-medium text-gray-700">
        {t("search.sale_type")}
      </BodyText>
      <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {SALE_TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.value || "all"}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            variant={selected === opt.value ? "primary" : "secondary"}
            size="sm"
            rounded="md"
            className={`min-w-[4rem] flex-1 ${selected === opt.value ? "shadow-sm" : ""}`}
          >
            {t(opt.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
