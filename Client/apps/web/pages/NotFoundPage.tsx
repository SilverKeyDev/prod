import Button from "@ui/button/Button";

import { Link, ROUTES } from "packages/navigation";

import { BodyText, Title } from "@/components/ui";

export default function NotFoundPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-background-base px-4"
    >
      <Title size="xl" as="h1" className="mb-2 text-center">
        Page not found
      </Title>
      <BodyText size="md" muted className="mb-8 text-center">
        The page you’re looking for doesn’t exist or has been moved.
      </BodyText>
      <Link to={ROUTES.HOME} className="inline-block">
        <Button variant="primary" size="md">
          Go to home
        </Button>
      </Link>
    </main>
  );
}
