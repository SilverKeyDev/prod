import type { PropertyDetails } from "../../../core/schemas/search";
import { useConsolidatedSearchStore } from "../../../core/store/search";

/**
 * Component that displays search results from the store
 * This demonstrates how to use the search store in components
 */
export function SearchResultsDisplay() {
  const {
    searchResults,
    isSearching: searchLoading,
    searchError,
    totalCount,
    hasMore,
    lastSearchQuery,
    clearSearchResults,
  } = useConsolidatedSearchStore();

  if (searchLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Searching for properties...</p>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Search Error</h3>
        <p className="text-red-600 mt-1">{searchError}</p>
        <button
          onClick={clearSearchResults}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Error
        </button>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>No search results found.</p>
        {lastSearchQuery && (
          <p className="text-sm mt-1">Last search: "{lastSearchQuery}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Results Header */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold">Search Results</h3>
          <p className="text-sm text-gray-600">
            Found {totalCount} properties
            {lastSearchQuery && <span> for "{lastSearchQuery}"</span>}
          </p>
        </div>
        <button
          onClick={clearSearchResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {searchResults.map((property: PropertyDetails) => (
          <div
            key={property.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {property.address}
                </h4>
                <p className="text-lg font-bold text-blue-600">
                  {property.price}
                </p>
                <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                  <span>{property.bedrooms} bed</span>
                  <span>{property.bathrooms} bath</span>
                  <span>{property.sqft.toLocaleString()} sqft</span>
                  {property.lotSize && <span>{property.lotSize}</span>}
                </div>
                {property._score && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Match Score: {property._score}%
                    </span>
                  </div>
                )}
              </div>
              {(property as any).imageUrl ||
              (property as any).image_url ||
              (property as any).imageSrc ||
              (property as any).imgSrc ||
              (property as any).images?.[0]?.url ||
              (property as any).imgUrl ? (
                <img
                  src={
                    (property as any).imageUrl ||
                    (property as any).image_url ||
                    (property as any).imageSrc ||
                    (property as any).imgSrc ||
                    (property as any).images?.[0]?.url ||
                    (property as any).imgUrl
                  }
                  alt={property.address}
                  className="w-20 h-20 object-cover rounded ml-4"
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Info */}
      {(totalCount > searchResults.length || hasMore) && (
        <div className="text-center text-sm text-gray-600">
          <p>
            Showing {searchResults.length} of {totalCount} results
            {hasMore && <span> (more results available)</span>}
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchResultsDisplay;
