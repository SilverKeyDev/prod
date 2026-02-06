import React from "react";
import { Lightbulb } from "lucide-react";
import { AlignedRow } from "../../components/layout";
import { FavoriteHomesDropdown, Button } from "../../components/ui";
import { SectionBox } from "./index";

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
};

export function HomeSelectorSection({
  selectedHome,
  isLoading,
  onHomeSelect,
  onGenerate,
}: HomeSelectorSectionProps): React.JSX.Element {
  return (
    <SectionBox>
      <AlignedRow gap="sm" justify="start" widths={[80, 20]}>
        <FavoriteHomesDropdown
          selectedHome={selectedHome}
          onHomeSelect={onHomeSelect}
          placeholder="Select a favorite home for strategy generation"
        />
        <Button
          variant="olive"
          hideTextBelow="md"
          loading={isLoading}
          icon={<Lightbulb className="mobile-icon-sm" />}
          onClick={onGenerate}
          disabled={!selectedHome || isLoading}
          className="h-full whitespace-nowrap"
        >
          Generate
        </Button>
      </AlignedRow>
    </SectionBox>
  );
}

