import { useMemo } from "react";

import { pages } from "virtual:silverkey-wiki";

import {
  resolveWikiPageKey,
  wikiDocPathFromRoute,
  wikiHrefForDocPath,
} from "packages/features/admin/utils/wiki/wikiTree";
import { useNavigation } from "packages/navigation";

export function useWikiPath() {
  const { getCurrentRoute, navigateToPath } = useNavigation();
  const route = getCurrentRoute();

  const requestedPath = useMemo(() => wikiDocPathFromRoute(route.pathname), [route.pathname]);
  const pageKey = useMemo(() => resolveWikiPageKey(requestedPath, pages), [requestedPath]);
  const page = pageKey ? (pages[pageKey] ?? null) : null;

  const navigateToDoc = (docPath: string) => {
    void navigateToPath(wikiHrefForDocPath(docPath));
  };

  return {
    requestedPath,
    pageKey,
    page,
    navigateToDoc,
  };
}
