import { breadcrumbSegments } from "packages/features/admin/utils/wiki/wikiTree";
import { BodyText, Box, Button } from "packages/ui";

type WikiBreadcrumbsProps = {
  docPath: string;
  onNavigate: (path: string) => void;
};

export function WikiBreadcrumbs({ docPath, onNavigate }: WikiBreadcrumbsProps) {
  const segments = breadcrumbSegments(docPath);

  return (
    <Box className="flex flex-wrap items-center gap-1">
      <BodyText size="xs" muted className="sr-only">
        Breadcrumb
      </BodyText>
      {segments.map((seg, index) => {
        const isLast = index === segments.length - 1;
        return (
          <Box key={`${seg.path || "root"}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <BodyText size="xs" muted className="select-none">
                /
              </BodyText>
            ) : null}
            {isLast ? (
              <BodyText size="sm" className="font-medium capitalize">
                {seg.label}
              </BodyText>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                label={seg.label}
                onPress={() => onNavigate(seg.path)}
                className="h-auto px-1 py-0.5 font-normal capitalize"
              >
                {seg.label}
              </Button>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
