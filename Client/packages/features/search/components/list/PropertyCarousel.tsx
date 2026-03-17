import { useLocalization } from "packages/contexts";
import { ConnectedCardHeartSave } from "packages/features/search/components/ConnectedCardHeartSave";
import { Box } from "packages/ui/components/primitives";

import { PropertyCard } from "@/components/cards";
import { CardCarousel, CardHeartSaveWithProps } from "@/components/cards/base/index.web";
import { BodyText } from "@/components/ui";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import type { SearchResult } from "@/features/search/types";
export function PropertyCarousel(props: {
  items: SearchResult[];
  currentPage: number;
  onViewDetails: (p: SearchResult) => void;
  onSlideChange?: (index: number) => void;
  cardMinWidth?: number;
  cardGap?: number;
  infiniteLoop?: boolean;
  activeTab?: "results" | "saved";
  // Optional saved-home controls from parent to keep UI in sync
  isHomeSaved?: (id: string, address?: string) => boolean;
  saveHome?: (p: SearchResult) => Promise<void>;
  removeSavedHome?: (id: string, address?: string) => Promise<void>;
}): JSX.Element {
  const {
    items,
    currentPage,
    onViewDetails,
    onSlideChange,
    infiniteLoop,
    activeTab = "results",
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = props;

  const { t } = useLocalization();
  const { markNotInterested, removeNotInterested } = useNotInterestedHomesData();

  if (items.length === 0) {
    return (
      <Box className="py-responsive-md sm:py-responsive-lg px-responsive-sm text-text-secondary text-center">
        <BodyText as="p" size="sm" className="sm:text-responsive-md">
          {t("search.no_properties_yet")}
        </BodyText>
        <BodyText as="p" size="xs" className="sm:text-responsive-sm mt-1">
          {t("search.tap_search_to_find")}
        </BodyText>
      </Box>
    );
  }

  return (
    <CardCarousel
      items={items}
      renderItem={(property: SearchResult, _index: number) => {
        const propertyAddress = typeof property.address === "string" ? property.address : "";

        return (
          <PropertyCard
            id={property.id}
            imageUrl={property.imageUrl}
            address={
              typeof property.address === "string" || typeof property.address === "number"
                ? property.address.toString()
                : "[Invalid address]"
            }
            price={
              typeof property.price === "string" || typeof property.price === "number"
                ? property.price.toString()
                : "[Invalid price]"
            }
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            sqft={property.sqft}
            onViewDetails={() => onViewDetails(property)}
            cardType="searchpage"
            hideImage={true}
            property={property}
            showNotInterested={activeTab === "results"}
            onSelectNotInterestedReason={
              activeTab === "results"
                ? async (why: string) => {
                    await markNotInterested(property, why);
                  }
                : undefined
            }
            onUndoNotInterested={
              activeTab === "results"
                ? async () => {
                    await removeNotInterested(property.id, propertyAddress);
                  }
                : undefined
            }
            topContent={
              isHomeSaved && saveHome && removeSavedHome ? (
                <CardHeartSaveWithProps
                  property={{
                    id: property.id,
                    address: typeof property.address === "string" ? property.address : undefined,
                  }}
                  isSaved={isHomeSaved(
                    property.id,
                    typeof property.address === "string" ? property.address : undefined
                  )}
                  saveHome={async () => saveHome(property)}
                  removeSavedHome={removeSavedHome}
                  size="sm"
                  position="top-right"
                />
              ) : (
                <ConnectedCardHeartSave property={property} size="sm" position="top-right" />
              )
            }
          />
        );
      }}
      getItemKey={(property: SearchResult, _index: number) => property.id}
      cardMinWidth={240}
      cardGap={12}
      infiniteLoop={infiniteLoop}
      centerMode={false}
      selectedItem={currentPage}
      onSlideChange={onSlideChange}
      key={`carousel-${items.length}`}
    />
  );
}
