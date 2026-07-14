import type { WikiTocItem } from "packages/features/admin/types/wiki";
import { BodyText, Box, Button, Title } from "packages/ui";
import { getDocument } from "packages/utils/core/platform";

type WikiTocProps = {
  items: readonly WikiTocItem[];
};

export function WikiToc({ items }: WikiTocProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box className="sticky top-0 hidden max-h-screen w-48 shrink-0 overflow-y-auto lg:block">
      <Title size="sm" as="h2" className="mb-2">
        On this page
      </Title>
      <Box className="flex flex-col gap-1 border-l border-gray-200 pl-3">
        {items.map((item) => (
          <Button
            key={`${item.level}-${item.id}`}
            variant="ghost"
            size="sm"
            label={item.text}
            onPress={() => {
              getDocument()
                ?.getElementById(item.id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            fullWidth
            contentAlign="start"
            className={`h-auto px-1 py-0.5 font-normal ${item.level === 3 ? "pl-3" : ""}`}
          >
            <BodyText size="xs" muted className="text-left">
              {item.text}
            </BodyText>
          </Button>
        ))}
      </Box>
    </Box>
  );
}
