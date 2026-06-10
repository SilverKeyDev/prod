import type { AdminSectionBaseProps } from "packages/features/admin/types/adminScope";
import { DEFAULT_ADMIN_SCOPE } from "packages/features/admin/types/adminScope";
import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";

type AdminPlaceholderSectionProps = AdminSectionBaseProps & {
  title: string;
  description: string;
};

export function AdminPlaceholderSection({
  title,
  description,
  scope: _scope = DEFAULT_ADMIN_SCOPE,
}: AdminPlaceholderSectionProps) {
  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h1" className="mb-2">
        {title}
      </Title>
      <BodyText size="sm" muted className="max-w-2xl">
        {description}
      </BodyText>
      <Box className="border-border mt-6 rounded-md border border-dashed p-8">
        <BodyText size="sm" muted className="text-center">
          No tools connected here yet.
        </BodyText>
      </Box>
    </Card>
  );
}
