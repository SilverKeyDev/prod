import Button from "@ui/button/Button";

import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Title } from "@/components/ui";

type ReelsSearchEmptyStateProps = {
  onSearch: () => void | Promise<void>;
  isSearching?: boolean;
};

export function ReelsSearchEmptyState({
  onSearch,
  isSearching = false,
}: ReelsSearchEmptyStateProps) {
  const title = SEARCH_TRANSLATIONS["search.reels_empty_title"] ?? "Search to get results";
  const subtitle =
    SEARCH_TRANSLATIONS["search.reels_empty_subtitle"] ??
    "Run a search to browse homes here in reels.";
  const searchLabel = SEARCH_TRANSLATIONS["search.search"] ?? "Search";
  const searchingLabel = SEARCH_TRANSLATIONS["search.searching"] ?? "Searching...";

  return (
    <Box className="flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center">
      <Title as="h2" size="lg" className="max-w-md text-white">
        {title}
      </Title>
      <BodyText size="md" className="mt-3 max-w-md text-white/75">
        {subtitle}
      </BodyText>
      <Box className="mt-10 w-full max-w-xs">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => void onSearch()}
          disabled={isSearching}
          aria-busy={isSearching}
        >
          {isSearching ? searchingLabel : searchLabel}
        </Button>
      </Box>
    </Box>
  );
}
