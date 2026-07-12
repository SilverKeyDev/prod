import { Icon } from "@ui/icons";

import type { WikiTreeNode } from "packages/features/admin/types/wiki";
import { wikiFolderIcon } from "packages/features/admin/utils/wiki/wikiFolderIcons";
import { BodyText, Box, Button } from "packages/ui";

type WikiTreeNavProps = {
  nodes: readonly WikiTreeNode[];
  activePath: string;
  expandedPaths: ReadonlySet<string>;
  onToggleFolder: (path: string) => void;
  onSelect: (path: string) => void;
  depth?: number;
};

export function WikiTreeNav({
  nodes,
  activePath,
  expandedPaths,
  onToggleFolder,
  onSelect,
  depth = 0,
}: WikiTreeNavProps) {
  return (
    <Box className="flex flex-col gap-1" role="tree">
      {nodes.map((node) => {
        if (node.type === "folder") {
          const isExpanded = expandedPaths.has(node.path);
          return (
            <Box key={`folder:${node.path}`} role="treeitem">
              <Button
                variant="ghost"
                size="sm"
                label={`Toggle ${node.label}`}
                onPress={() => onToggleFolder(node.path)}
                fullWidth
                contentAlign="start"
                className="gap-1 px-2 py-1.5 font-medium text-gray-900"
                style={{ paddingLeft: 8 + depth * 12 }}
                aria-expanded={isExpanded}
              >
                <Icon
                  name={isExpanded ? "chevron-down" : "chevron-right"}
                  size={14}
                  className="shrink-0 text-gray-500"
                />
                <Icon
                  name={wikiFolderIcon(node.name, depth)}
                  size={14}
                  className="shrink-0 text-gray-500"
                />
                <BodyText size="sm" className="truncate text-left font-medium text-gray-900">
                  {node.label}
                </BodyText>
              </Button>
              {isExpanded ? (
                <Box className="ml-3 border-l border-gray-200 pl-1">
                  <WikiTreeNav
                    nodes={node.children}
                    activePath={activePath}
                    expandedPaths={expandedPaths}
                    onToggleFolder={onToggleFolder}
                    onSelect={onSelect}
                    depth={depth + 1}
                  />
                </Box>
              ) : null}
            </Box>
          );
        }

        const isActive = activePath === node.path;
        return (
          <Button
            key={`page:${node.path}`}
            variant="ghost"
            size="sm"
            label={node.title}
            iconName="file-text"
            onPress={() => onSelect(node.path)}
            fullWidth
            contentAlign="start"
            className={`px-2 py-1.5 font-normal ${
              isActive ? "bg-brand-accent/10 text-brand-accent" : "text-gray-600"
            }`}
            style={{ paddingLeft: 8 + depth * 12 }}
            role="treeitem"
            aria-selected={isActive}
            aria-current={isActive ? "page" : undefined}
          >
            {node.title}
          </Button>
        );
      })}
    </Box>
  );
}
