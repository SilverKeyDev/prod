/**
 * Per-page error boundary for Search and Saved so a failure in one page
 * shows an in-page error with retry instead of breaking the whole route.
 * Keeps sidebar and layout mounted.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import { Link } from "packages/navigation";

import { BodyText, Button, Title } from "@/components/ui";
type PageErrorBoundaryProps = {
  children: ReactNode;
  /** Optional label for the page (e.g. "Search", "Saved") for the error message. */
  pageLabel?: string;
};
type PageErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    log.error(LOG_CATEGORIES.ERRORS, "PageErrorBoundary caught error", error);
  }
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };
  render(): ReactNode {
    if (this.state.hasError) {
      const label = this.props.pageLabel ?? "This page";
      return (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-border bg-background-surface p-6 text-center">
          <Title size="md" as="h2" className="mb-2 text-text-primary">
            Something went wrong
          </Title>
          <BodyText size="sm" muted className="mb-6">
            {label} couldn’t load. You can try again or go to the dashboard.
          </BodyText>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={this.handleRetry}
              icon={<Icon name="refresh-cw" className="h-4 w-4" />}
              size="md"
            >
              Try again
            </Button>
            <Link to="/dashboard" className="inline-block">
              <Button variant="outline" size="md">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default PageErrorBoundary;
