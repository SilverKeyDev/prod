import React from "react";

import { Icon } from "@ui/icons";

import SectionCard from "packages/ui/components/cards/SectionCard";

import { BodyText } from "@/components/ui";
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
    <SectionCard title="Search & Activity" iconName="home">
      <div className="space-y-6">
        {/* Activity Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-border bg-background-surface flex items-center gap-3 rounded-lg border p-4">
            <div className="bg-primary-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Icon name="eye" className="text-text-primary h-5 w-5" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-text-secondary">
                Viewed
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {viewedHomes}
              </BodyText>
            </div>
          </div>

          <div className="border-border bg-background-surface flex items-center gap-3 rounded-lg border p-4">
            <div className="bg-primary-muted flex h-10 w-10 items-center justify-center rounded-full">
              <Icon name="heart" className="text-destructive h-5 w-5" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-text-secondary">
                Favorited
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {favoritedHomes}
              </BodyText>
            </div>
          </div>

          <div className="border-border bg-background-surface flex items-center gap-3 rounded-lg border p-4">
            <div className="bg-background-base flex h-10 w-10 items-center justify-center rounded-full">
              <Icon name="x" className="text-text-secondary h-5 w-5" />
            </div>
            <div>
              <BodyText as="p" size="sm" className="text-text-secondary">
                Rejected
              </BodyText>
              <BodyText as="p" size="lg" className="font-semibold text-black">
                {rejectedHomes}
              </BodyText>
            </div>
          </div>
        </div>

        {/* Placeholder for homes list */}
        <div className="border-border bg-accent-muted rounded-lg border py-8 text-center">
          <BodyText as="p" size="sm" className="text-text-secondary">
            Home activity details will appear here
          </BodyText>
          <BodyText as="p" size="xs" className="text-text-disabled mt-2">
            (Integration with saved homes API pending)
          </BodyText>
        </div>
      </div>
    </SectionCard>
  );
};
export default SearchActivity;
