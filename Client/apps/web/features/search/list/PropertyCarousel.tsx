import { useLocalization } from "packages/contexts";
import { useNotInterestedHomesData } from "packages/hooks/data/search/saved/useNotInterestedHomesData";
import type { SearchResult } from "packages/schemas/search";

import { PropertyCard } from "@/components/cards";
import { CardCarousel } from "@/components/cards/base/index.web";
import { CardHeartSave } from "@/components/cards/base/index.web";
import { BodyText } from "@/components/ui/index.web";

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
  const { markNotInterested, removeNotInterested } =
    useNotInterestedHomesData();

  if (items.length === 0) {
    return (
      <div className="py-responsive-md sm:py-responsive-lg px-responsive-sm text-center text-gray-500">
        <BodyText as="p" size="sm" className="sm:text-responsive-md">
          {t("search.no_properties_yet")}
        </BodyText>
        <BodyText as="p" size="xs" className="mt-1 sm:text-responsive-sm">
          {t("search.tap_search_to_find")}
        </BodyText>
      </div>
    );
  }

  return (
    <CardCarousel
      items={items}
      renderItem={(property: SearchResult, _index: number) => {
        const propertyAddress =
          typeof property.address === "string" ? property.address : "";

        return (
          <PropertyCard
            id={property.id}
            imageUrl={property.imageUrl}
            address={
              typeof property.address === "string" ||
              typeof property.address === "number"
                ? property.address.toString()
                : "[Invalid address]"
            }
            price={
              typeof property.price === "string" ||
              typeof property.price === "number"
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
              <CardHeartSave
                property={property}
                size="sm"
                position="top-right"
                isHomeSaved={isHomeSaved}
                saveHome={
                  saveHome
                    ? async (propertyArg) =>
                        // property could be SearchResult or Property. Convert Property to SearchResult shape if necessary.
                        saveHome(
                          ("price" in propertyArg &&
                          typeof propertyArg.price === "number"
                            ? {
                                ...propertyArg,
                                price: propertyArg.price.toString(),
                              }
                            : propertyArg) as SearchResult,
                        )
                    : undefined
                }
                removeSavedHome={removeSavedHome}
              />
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
