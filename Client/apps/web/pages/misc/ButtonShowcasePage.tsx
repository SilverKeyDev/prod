import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, CancelButton, Title } from "@/components/ui";

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
  "success",
  "cancel",
] as const;
const SIZES = ["sm", "md", "lg"] as const;

/**
 * Lightweight visual regression showcase for Button variants, sizes, icons, and disabled state.
 * Route: /button-showcase (dev/internal).
 */
export default function ButtonShowcasePage() {
  return (
    <Box className="min-h-screen bg-background-base p-6">
      <Title size="lg" as="h1" className="mb-2">
        Button showcase
      </Title>
      <BodyText size="sm" muted className="mb-8">
        All variants × sizes, with/without icon, disabled, and two-button rows.
      </BodyText>

      <section className="mb-10">
        <Title size="md" as="h2" className="mb-4">
          Variants × sizes
        </Title>
        <Box className="flex flex-wrap gap-4">
          {VARIANTS.map((v) =>
            SIZES.map((s) => (
              <Button key={`${v}-${s}`} variant={v} size={s}>
                {v} {s}
              </Button>
            ))
          )}
        </Box>
      </section>

      <section className="mb-10">
        <Title size="md" as="h2" className="mb-4">
          With icon (left / right / edge)
        </Title>
        <Box className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="md" iconName="search">
            Icon left
          </Button>
          <Button variant="primary" size="md" iconName="search" iconPosition="right">
            Icon right
          </Button>
          <Button
            variant="outline"
            size="md"
            iconName="search"
            iconPosition="right"
            iconAlign="edge"
          >
            Icon edge
          </Button>
        </Box>
      </section>

      <section className="mb-10">
        <Title size="md" as="h2" className="mb-4">
          Disabled
        </Title>
        <Box className="flex flex-wrap gap-4">
          <Button variant="primary" size="md" disabled>
            Primary disabled
          </Button>
          <Button variant="outline" size="md" disabled>
            Outline disabled
          </Button>
          <Button variant="ghost" size="md" disabled>
            Ghost disabled
          </Button>
        </Box>
      </section>

      <section className="mb-10">
        <Title size="md" as="h2" className="mb-4">
          Two-button rows (Primary + Ghost, Primary + Outline)
        </Title>
        <Box className="flex flex-col gap-4">
          <Box className="flex flex-wrap gap-2">
            <Button variant="primary" size="md">
              Yes
            </Button>
            <CancelButton size="md">Cancel</CancelButton>
          </Box>
          <Box className="flex flex-wrap gap-2">
            <Button variant="primary" size="md">
              Next
            </Button>
            <Button variant="outline" size="md">
              Back
            </Button>
          </Box>
        </Box>
      </section>
    </Box>
  );
}
