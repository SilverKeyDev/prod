import React from "react";

import { Lightbulb } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { Button, CancelButton, FavoriteHomesDropdown } from "packages/ui/components/index.web";

import { AlignedRow } from "@/components/layout";

import SectionBox from "./SectionBox";

type FavoriteHome = {
  user_id: string;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type HomeSelectorSectionProps = {
  selectedHome: FavoriteHome | null;
  isLoading: boolean;
  onHomeSelect: (home: unknown) => void;
  onGenerate: () => void;
  onCancel?: () => void;
};

export function HomeSelectorSection({
  selectedHome,
  isLoading,
  onHomeSelect,
  onGenerate,
  onCancel,
}: HomeSelectorSectionProps): React.JSX.Element {
  const { t } = useLocalization();
  return (
    <SectionBox>
      <AlignedRow gap="sm" justify="start" widths={[80, 20]}>
        <FavoriteHomesDropdown
          selectedHome={selectedHome}
          onHomeSelect={onHomeSelect}
          placeholder={t("negotiate.home_selector.placeholder")}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            hideTextBelow="md"
            loading={isLoading}
            icon={<Lightbulb className="mobile-icon-sm" />}
            onClick={onGenerate}
            disabled={!selectedHome || isLoading}
            className="h-full whitespace-nowrap"
          >
            {t("negotiate.home_selector.generate")}
          </Button>
          {isLoading && onCancel && (
            <CancelButton onClick={onCancel} size="sm" className="h-full">
              {t("common.cancel")}
            </CancelButton>
          )}
        </div>
      </AlignedRow>
    </SectionBox>
  );
}
