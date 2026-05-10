import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

type AdminPlaceholderSectionProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderSection({ title, description }: AdminPlaceholderSectionProps) {
  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h1" className="mb-2">
        {title}
      </Title>
      <BodyText size="sm" muted className="max-w-2xl">
        {description}
      </BodyText>
      <Box className="mt-6 rounded-md border border-dashed border-border p-8">
        <BodyText size="sm" muted className="text-center">
          No tools connected here yet.
        </BodyText>
      </Box>
    </Card>
  );
}
