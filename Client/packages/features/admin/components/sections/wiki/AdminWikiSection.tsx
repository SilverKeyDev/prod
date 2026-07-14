import { useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";
import { pages, tree } from "virtual:silverkey-wiki";

import { useWikiPath } from "packages/features/admin/hooks/useWikiPath";
import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import {
  expandPathsForActive,
  extractWikiToc,
  filterWikiTree,
  resolveWikiPageKey,
} from "packages/features/admin/utils/wiki/wikiTree";
import { BodyText, Box, Input, Title } from "packages/ui";

import Card from "@/components/layout/Card.web";

import { WikiArticle } from "./WikiArticle";
import { WikiBreadcrumbs } from "./WikiBreadcrumbs";
import { WikiToc } from "./WikiToc";
import { WikiTreeNav } from "./WikiTreeNav";

export function AdminWikiSection({ scope: _scope = DEFAULT_ADMIN_SCOPE }: AdminSectionBaseProps) {
  const { requestedPath, pageKey, page, navigateToDoc } = useWikiPath();
  const [search, setSearch] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    expandPathsForActive(pageKey ?? requestedPath)
  );

  useEffect(() => {
    const next = expandPathsForActive(pageKey ?? requestedPath);
    setExpandedPaths((prev) => {
      const merged = new Set(prev);
      for (const p of next) merged.add(p);
      return merged;
    });
  }, [pageKey, requestedPath]);

  const filteredTree = useMemo(() => filterWikiTree(tree, search), [search]);
  const toc = useMemo(() => (page ? extractWikiToc(page.content) : []), [page]);

  const activePath = pageKey ?? "";

  const handleToggleFolder = (folderPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      const wasOpen = next.has(folderPath);
      if (wasOpen) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
    if (!expandedPaths.has(folderPath) && resolveWikiPageKey(folderPath, pages)) {
      navigateToDoc(folderPath);
    }
  };

  const handleSelectPage = (path: string) => {
    navigateToDoc(path);
  };

  return (
    <Card border="light" padding="none" className="w-full overflow-hidden">
      <Box className="flex min-h-96 flex-col lg:flex-row">
        <Box className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-gray-50 lg:w-64 lg:border-b-0 lg:border-r">
          <Box className="border-b border-gray-200 bg-gray-50 p-3">
            <Title size="sm" as="h1" className="mb-2">
              Wiki
            </Title>
            <Input
              variant="search"
              size="sm"
              label="Search documentation"
              placeholder="Search docs…"
              value={search}
              onValueChange={setSearch}
              leftIcon={<Icon name="search" size={16} />}
              clearable
              onClear={() => setSearch("")}
            />
          </Box>
          <Box className="max-h-64 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
            {filteredTree.length === 0 ? (
              <BodyText size="sm" muted className="px-2 py-3">
                No matching pages.
              </BodyText>
            ) : (
              <WikiTreeNav
                nodes={filteredTree}
                activePath={activePath}
                expandedPaths={expandedPaths}
                onToggleFolder={handleToggleFolder}
                onSelect={handleSelectPage}
              />
            )}
          </Box>
        </Box>

        <Box className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:flex-row lg:p-6">
          <Box className="min-w-0 flex-1">
            <WikiBreadcrumbs
              docPath={pageKey ?? requestedPath}
              onNavigate={(path) => {
                if (!path) {
                  navigateToDoc("");
                  return;
                }
                const key = resolveWikiPageKey(path, pages);
                navigateToDoc(key ?? path);
              }}
            />
            {page ? (
              <Box className="mt-4">
                <WikiArticle
                  content={page.content}
                  currentDocPath={pageKey ?? ""}
                  onNavigate={navigateToDoc}
                />
              </Box>
            ) : (
              <Box className="mt-8">
                <Title size="md" as="h2">
                  Select a page
                </Title>
                <BodyText size="sm" muted className="mt-2">
                  Choose a document from the tree, or search by title and path.
                </BodyText>
              </Box>
            )}
          </Box>
          <WikiToc items={toc} />
        </Box>
      </Box>
    </Card>
  );
}
