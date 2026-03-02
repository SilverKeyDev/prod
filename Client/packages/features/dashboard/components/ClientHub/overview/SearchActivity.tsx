import React from "react";

import { Eye, Heart, Home, X } from "lucide-react";

import SectionCard from "packages/ui/components/cards/SectionCard";
import { BodyText } from "packages/ui/components/index.web";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-beige/30 flex items-center gap-3 rounded-lg border bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Eye className="text-navy h-5 w-5" />
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

          <div className="border-beige/30 flex items-center gap-3 rounded-lg border bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
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

          <div className="border-beige/30 flex items-center gap-3 rounded-lg border bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50">
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
        <div className="border-beige/30 bg-beige/5 rounded-lg border py-8 text-center">
          <BodyText as="p" size="sm" className="text-black/60">
            Home activity details will appear here
          </BodyText>
          <BodyText as="p" size="xs" className="mt-2 text-black/40">
            (Integration with saved homes API pending)
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};

export default SearchActivity;
