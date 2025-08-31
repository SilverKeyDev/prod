import React from "react";
import { Card } from "../ui/base";
import { MapPin, TrendingUp } from "lucide-react";

export interface SearchResultsSummaryCardProps {
  totalResults: number;
  averageScore?: number;
  searchArea?: string;
  className?: string;
}

const SearchResultsSummaryCard: React.FC<SearchResultsSummaryCardProps> = ({
  totalResults,
  averageScore,
  searchArea,
  className = ""
}) => {
  return (
    <Card className={`${className}`} padding="sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brown/10 rounded-lg">
            <MapPin className="w-5 h-5 text-brown" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Search Results</h3>
            <p className="text-sm text-gray-600">
              {totalResults} {totalResults === 1 ? 'property' : 'properties'} found
              {searchArea && ` in ${searchArea}`}
            </p>
          </div>
        </div>
        
        {averageScore !== undefined && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium">Avg Match</p>
              <p className="text-sm font-semibold text-green-700">
                {Math.round(averageScore)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SearchResultsSummaryCard;
