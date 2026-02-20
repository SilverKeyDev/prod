import React from "react";

import { Eye, Heart, Home, X } from "lucide-react";

import SectionCard from "@/components/layout/SectionCard";
import { BodyText } from "@/components/ui/index.web";

type SearchActivityProps = {
  // This would integrate with saved homes API when available
  viewedHomes?: number;
  favoritedHomes?: number;
  rejectedHomes?: number;
};

const SearchActivity: React.FC<SearchActivityProps> = ({
  viewedHomes = 0,
  favoritedHomes = 0,
  rejectedHomes = 0,
}) => {
  return (
    <SectionCard title="Search & Activity" icon={Home}>
      <div className="space-y-6">
        {/* Activity Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-beige/30 bg-white">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-navy" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-black/60">
                Viewed
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {viewedHomes}
              </BodyText>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border border-beige/30 bg-white">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-black/60">
                Favorited
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {favoritedHomes}
              </BodyText>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border border-beige/30 bg-white">
            <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center">
              <X className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-black/60">
                Rejected
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {rejectedHomes}
              </BodyText>
            </div>
          </div>
        </div>

        {/* Placeholder for homes list */}
        <div className="text-center py-8 border border-beige/30 rounded-lg bg-beige/5">
          <BodyText as="p" size="sm" className="text-black/60">
            Home activity details will appear here
          </BodyText>
          <BodyText as="p" size="xs" className="text-black/40 mt-2">
            (Integration with saved homes API pending)
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};

export default SearchActivity;
