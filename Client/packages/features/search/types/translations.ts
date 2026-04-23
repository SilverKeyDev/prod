/** Search feature translation strings. */
export const SEARCH_TRANSLATIONS: Record<string, string> = {
  "search.location_bar_placeholder": "City, neighborhood, or ZIP",
  "search.show_commute_area": "Show commute area",
  "search.show_commute_area_hint":
    "For searches from your profile (important locations). Shows drive-time areas when on, or a simple bounds around those places when off. Map-only searches use the place or area you picked instead.",
  "search.map_area_unavailable": "Move the map, then search this area.",
  "search.search": "Search",
  "search.searching": "Searching...",
  "search.searching_properties": "Searching properties...",
  "search.filters": "Filters",
  "search.list": "List",
  "search.add_location_to_search": "Add at least one location to search",
  "search.need_locations_or_place":
    "Add important locations in Filters, or type a city, neighborhood, or ZIP in the search bar and search.",
  "search.reels": "Reels",
  "search.reels_empty_title": "Search to get results",
  "search.reels_empty_subtitle": "Run a search to browse homes here in reels.",
  "search.map": "Map",
  "search.add_location": "Add location",
  "search.add_important_locations": "Add important locations",
  "search.add_work_school_location": "Add work, school, or other location",
  "search.editing_location": "Editing location",
  "search.edit_locations": "Edit locations",
  "search.location_preferences": "Location preferences",
  "search.location_preferences_description":
    "Add work, family, or other places. We'll use these to find homes that fit your life.",
  "search.sale_type": "Sale type",
  "search.sale_type_all": "All",
  "search.sale_type_for_sale": "For sale",
  "search.sale_type_pending": "Pending",
  "search.sale_type_sold": "Sold",
  "search.more": "Preferences",
  "search.agent_sync_preferences_label": "Match my preferences to a client",
  "search.agent_sync_preferences_hint":
    "You can’t edit your client’s saved preferences. This copies their saved preferences to your account so your search profile matches theirs.",
  "search.agent_filter_edits_save_to_your_profile":
    "You’re viewing this client’s preferences. Edits here save to your profile only—we never change your client’s saved preferences.",
  "search.agent_sync_preferences_success": "Your preferences now match {{name}}’s.",
  "search.agent_sync_preferences_error": "Couldn’t copy preferences. Try again.",
  "search.agent_sync_preferences_client_fallback": "your client",
  "search.search_tab": "Results",
  "search.saved_tab": "Saved",
  "search.close_filters": "Close filters",
  "search.apply": "Apply",
  "search.other": "Other",
  "search.saved": "Saved",
  "search.zoom_out": "Zoom out",
  "search.zoom_out_symbol": "−",
  "search.zoom_in": "Zoom in",
  "search.zoom_in_symbol": "+",
  "search.previous_properties": "Previous properties",
  "search.next_properties": "Next properties",
  "search.page_of": "{{current}} of {{total}}",
  "search.commute_min": "{{min}} min",
  "search.locations_more": "+{{count}} more",
  "search.click_map_to_search": "Click on the map to search this area",
  "search.no_saved_homes_yet": "No saved homes yet",
  "search.click_heart_to_save": "Click the heart on a home to save it",
  "search.current_location": "Current Location",
  "search.locating": "Finding your location...",
  "search.location_unavailable":
    "Unable to determine your location. Please allow location access and try again.",
  "search.no_properties_yet": "No properties yet",
  "search.tap_search_to_find": "Tap Search to find homes that match your preferences",
  "search.no_results_try_adjusting":
    "No homes match your search yet. Try adjusting your preferences.",
  "search.empty_results_strict_preferences":
    'No homes matched with strict preferences on. Try turning off "Match all preferences strictly," or relax your filters and search again.',
  "search.invalid_search_area":
    "We couldn’t build a search area from your locations. Add or fix important locations in Filters, then try again.",
  "search.viewport_search_area_invalid":
    "This map area couldn’t be searched. Zoom or move the map and try again.",
  "search.map_not_ready": "The map is still loading. Wait a moment, then search again.",
  "search.map_missing": "The map isn’t ready yet. Try again in a moment.",
  "search.search_failed_generic":
    "Something went wrong and we couldn’t finish the search. Try again.",
  "search.run_search_to_see_homes": "Run a search to see homes that match your profile.",
  "search.price_range": "Price range",
  "search.filters_beds_baths_range": "Beds and baths",
  "search.must_have_features": "Must-have features",
  "search.must_have_features_hint":
    "Every home in your results must include all of these (garage, pool, AC, etc.).",
  "search.preferred_features_ranking": "Features that boost match score",
  "search.preferred_features_hint":
    "Optional. We rank homes higher when the listing mentions these.",
  "search.beds": "Beds",
  "search.baths": "Baths",
  "search.display": "Display",
  "search.display_order_by": "Order by",
  "search.display_sort_direction": "Sort direction",
  "search.sort_low_to_high": "Low to high",
  "search.sort_high_to_low": "High to low",
  "search.dismiss_map_listing_preview": "Hide this listing preview on the map",
  "search.strict_preferences": "Match all preferences strictly",
  "search.strict_preferences_hint":
    "When off, we only apply every preference filter when there are more than 100 homes in the search area, so small result sets stay broader.",
  "search.order_match_score": "Match score",
  "search.order_price": "Price",
  "search.order_distance": "Distance",
  "search.order_bedrooms": "Bedrooms",
  "search.order_bathrooms": "Bathrooms",
  "search.order_lot_size": "Lot size",
  "search.order_home_age": "Home age",
  "search.agent_share_select_add_aria": "Select home to share with client",
  "search.agent_share_select_remove_aria": "Remove home from share selection",
  "search.agent_share_home_selected": "1 home selected to share",
  "search.agent_share_homes_selected": "{{count}} homes selected to share",

  /** Product tour (driver.js): keyed copy for future locale bundles — see `packages/utils/tour/productTourSteps`. */
  "search.product_tour.desktop.search_location_title": "Search location",
  "search.product_tour.desktop.search_location_description":
    "Enter a city, neighborhood, or ZIP. The map focuses here before you run a search.",
  "search.product_tour.desktop.run_search_title": "Run search",
  "search.product_tour.desktop.run_search_description":
    "Tap Search to load homes for this area using your preferences and filters.",
  "search.product_tour.desktop.results_tabs_title": "Results and saved",
  "search.product_tour.desktop.results_tabs_description":
    "Switch between fresh results from your search and homes you have saved.",
  "search.product_tour.desktop.listing_cards_title": "Listing cards",
  "search.product_tour.desktop.listing_cards_description":
    "Browse matches here. Select a home to see details and the map selection.",
  "search.product_tour.desktop.map_title": "Map",
  "search.product_tour.desktop.map_description":
    "Explore geographically. Zoom and pan to refine what you are looking at.",

  "search.product_tour.mobile.search_title": "Search",
  "search.product_tour.mobile.search_description":
    "Use filters, then Search to load homes. Cancel stops an in-progress search.",
  "search.product_tour.mobile.results_tabs_title": "Results and saved",
  "search.product_tour.mobile.results_tabs_description":
    "Toggle between search results and your saved homes.",
  "search.product_tour.mobile.carousel_title": "Carousel",
  "search.product_tour.mobile.carousel_description":
    "Swipe through listings. Expand or collapse this strip as needed.",
  "search.product_tour.mobile.map_title": "Map",
  "search.product_tour.mobile.map_description":
    "View homes on the map and pinch or zoom to explore the area.",
};
