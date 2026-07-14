import React, { useEffect, useRef, useState } from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  DROPDOWN_OPTION_ROW_BASE_CLASSES,
  DROPDOWN_TRIGGER_INNER_FOCUS_RESET,
} from "packages/ui/components/inputs/form/dropdown/dropdownStyles";
import KeyTurnLoader from "packages/ui/components/media/asset/loading/KeyTurnLoader.web";
import { Box } from "packages/ui/components/structure/primitives";
import { getDocument } from "packages/utils/core/platform";

import {
  type FavoriteHomeItem,
  useFavoriteHomesList,
} from "@/features/profile/hooks/data/useFavoriteHomesList";
type FavoriteHome = FavoriteHomeItem;
type FavoriteHomesDropdownProps = {
  selectedHome: FavoriteHome | null;
  onHomeSelect: (home: FavoriteHome) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};
const FavoriteHomesDropdown: React.FC<FavoriteHomesDropdownProps> = ({
  selectedHome,
  onHomeSelect,
  className = "",
  placeholder,
  disabled = false,
}) => {
  const { t } = useLocalization();
  const { favoriteHomes, loading: loadingHomes } = useFavoriteHomesList();
  const displayPlaceholder = placeholder ?? t("favorite_homes.placeholder");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Handle dropdown toggle
  const toggleDropdown = () => {
    if (!disabled && !loadingHomes) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };
  // Handle home selection
  const handleHomeSelection = (home: FavoriteHome) => {
    onHomeSelect(home);
    setIsDropdownOpen(false);
  };
  // Handle click outside dropdown (guarded for RN; only runs when document exists)
  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    doc.addEventListener("mousedown", handleClickOutside);
    return () => {
      doc.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <Box className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        onClick={toggleDropdown}
        className={`border-border focus:border-input-variant-focus-border bg-background-surface flex h-12 w-full items-center gap-2 rounded-lg border px-3 transition-colors duration-200 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 ${className}`}
        disabled={disabled ?? loadingHomes}
        icon={<Icon name="home" className="text-primary h-4 w-4 shrink-0" />}
      >
        <Box className="min-w-0 flex-1 text-left">
          {loadingHomes ? (
            <KeyTurnLoader message={t("favorite_homes.loading_homes")} />
          ) : selectedHome ? (
            <Box>
              <Box className="text-responsive-xs text-text-primary font-medium">
                {(() => {
                  const { address } = selectedHome;
                  const lastCommaIndex = address.lastIndexOf(",");
                  return lastCommaIndex > 0 ? address.substring(0, lastCommaIndex) : address;
                })()}
              </Box>
              <Box className="text-responsive-xs text-text-secondary hidden sm:block">
                {selectedHome.beds && selectedHome.baths
                  ? t("favorite_homes.bed_bath", {
                      beds: String(selectedHome.beds),
                      baths: String(selectedHome.baths),
                    })
                  : t("favorite_homes.selected_property")}
                {selectedHome.price &&
                  ` • ${
                    selectedHome.price.startsWith("$")
                      ? selectedHome.price
                      : `$${selectedHome.price}`
                  }`}
              </Box>
            </Box>
          ) : (
            <Box>
              <Box className="text-responsive-xs text-text-secondary">{displayPlaceholder}</Box>
              {placeholder === undefined ? (
                <Box className="text-responsive-xs text-text-secondary mt-0.5 hidden sm:block">
                  {t("favorite_homes.choose_saved_properties")}
                </Box>
              ) : null}
            </Box>
          )}
        </Box>
        <Icon
          name="chevron-down"
          className={`text-primary h-4 w-4 transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isDropdownOpen && !loadingHomes && !disabled && (
        <Box className="border-border bg-background-surface z-dropdown absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-lg">
          {favoriteHomes.length === 0 ? (
            <Box className="text-text-secondary px-3 py-2 text-center text-sm">
              {t("favorite_homes.no_favorite_homes_found")}
            </Box>
          ) : (
            favoriteHomes.map((home) => {
              return (
                <Button
                  key={home.address}
                  type="button"
                  variant="ghost"
                  onClick={() => handleHomeSelection(home)}
                  className={`${DROPDOWN_OPTION_ROW_BASE_CLASSES} ${DROPDOWN_TRIGGER_INNER_FOCUS_RESET} text-sm ${
                    selectedHome?.address === home.address
                      ? "bg-primary-muted text-primary"
                      : "text-text-primary hover:bg-neutral-100"
                  }`}
                  iconName="heart"
                >
                  <Box className="text-responsive-xs">
                    {(() => {
                      const { address } = home;
                      const lastCommaIndex = address.lastIndexOf(",");
                      return lastCommaIndex > 0 ? address.substring(0, lastCommaIndex) : address;
                    })()}
                  </Box>
                  <Box className="text-responsive-xs text-text-secondary mt-1 hidden sm:block">
                    {home.beds && home.baths
                      ? t("favorite_homes.bed_bath", {
                          beds: String(home.beds),
                          baths: String(home.baths),
                        })
                      : t("favorite_homes.property_details")}
                    {home.sqft &&
                      Number(home.sqft) > 0 &&
                      ` • ${Math.round(Number(home.sqft)).toLocaleString()} sqft`}
                    {home.price &&
                      ` • ${home.price.startsWith("$") ? home.price : `$${home.price}`}`}
                  </Box>
                </Button>
              );
            })
          )}
        </Box>
      )}
    </Box>
  );
};
export default FavoriteHomesDropdown;
