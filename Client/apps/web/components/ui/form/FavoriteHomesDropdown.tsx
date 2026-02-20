import React, { useEffect, useRef, useState } from "react";

import KeyTurnLoader from "@ui/loading/KeyTurnLoader.web";
import { ChevronDown, Home } from "lucide-react";

import { useLocalization } from "packages/contexts";
import {
  type FavoriteHomeItem,
  useFavoriteHomesList,
} from "packages/hooks/data/user/useFavoriteHomesList";

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

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex h-full w-full items-center gap-2 rounded-lg border border-beige bg-white px-2 py-2 transition-colors duration-200 hover:border-brown focus:border-brown focus:ring-2 focus:ring-brown/20 lg:px-3 lg:py-3 ${className}`}
        disabled={disabled ?? loadingHomes}
      >
        <Home className="h-4 w-4 text-brown" />
        <div className="flex-1 text-left">
          {loadingHomes ? (
            <KeyTurnLoader message={t("favorite_homes.loading_homes")} />
          ) : selectedHome ? (
            <div>
              <div className="text-responsive-xs font-medium text-navy">
                {(() => {
                  const { address } = selectedHome;
                  const lastCommaIndex = address.lastIndexOf(",");
                  return lastCommaIndex > 0
                    ? address.substring(0, lastCommaIndex)
                    : address;
                })()}
              </div>
              <div className="text-responsive-xs hidden text-gray-500 sm:block">
                {selectedHome.beds && selectedHome.baths
                  ? t("favorite_homes.bed_bath", {
                      beds: String(selectedHome.beds),
                      baths: String(selectedHome.baths),
                    })
                  : t("favorite_homes.selected_property")}
                {selectedHome.price &&
                  ` • ${selectedHome.price.startsWith("$") ? selectedHome.price : `$${selectedHome.price}`}`}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-responsive-xs text-gray-500">
                {displayPlaceholder}
              </div>
              <div className="text-responsive-xs hidden text-gray-400 sm:block">
                {t("favorite_homes.choose_saved_properties")}
              </div>
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-brown transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && !loadingHomes && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-beige bg-white shadow-lg">
          {favoriteHomes.length === 0 ? (
            <div className="px-3 py-2 text-center text-sm text-gray-500">
              {t("favorite_homes.no_favorite_homes_found")}
            </div>
          ) : (
            favoriteHomes.map((home, index) => {
              return (
                <button
                  key={home.address}
                  onClick={() => handleHomeSelection(home)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    index === 0 ? "first:rounded-t-lg" : ""
                  } ${index === favoriteHomes.length - 1 ? "last:rounded-b-lg" : ""} ${
                    selectedHome?.address === home.address
                      ? "bg-brown/10 text-brown"
                      : "text-black hover:bg-brown/5"
                  }`}
                >
                  <div className="text-responsive-xs">
                    {(() => {
                      const { address } = home;
                      const lastCommaIndex = address.lastIndexOf(",");
                      return lastCommaIndex > 0
                        ? address.substring(0, lastCommaIndex)
                        : address;
                    })()}
                  </div>
                  <div className="text-responsive-xs mt-1 hidden text-gray-500 sm:block">
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
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FavoriteHomesDropdown;
