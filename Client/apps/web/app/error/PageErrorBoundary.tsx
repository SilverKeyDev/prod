/**
 * Per-page error boundary for Search and Saved so a failure in one page
 * shows an in-page error with retry instead of breaking the whole route.
 * Keeps sidebar and layout mounted.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Icon } from "@ui/icons";

import { log } from "packages/logger";
import { Link } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";
type PageErrorBoundaryProps = {
  children: ReactNode;
  /** Optional label for the page (e.g. "Search", "Library") for the error message. */
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
    log.error("ERRORS", "PageErrorBoundary caught error", error);
  }
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };
  render(): ReactNode {
    if (this.state.hasError) {
      const label = this.props.pageLabel ?? "This page";
      return (
        <Box className="flex min-h-[min(260px,45dvh)] w-full min-w-0 max-w-full flex-col items-center justify-center rounded-lg border border-border bg-background-surface py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] text-center sm:min-h-[280px] sm:p-6">
          <Title size="md" as="h2" className="mb-2 px-1 text-text-primary">
            Something went wrong
          </Title>
          <BodyText size="sm" muted className="mb-6 max-w-md text-balance break-words">
            {label} couldn’t load. You can try again or go to the dashboard.
          </BodyText>
          <Box className="flex w-full min-w-0 max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Button
              variant="primary"
              onClick={this.handleRetry}
              icon={<Icon name="refresh-cw" className="h-4 w-4" />}
              size="md"
              className="w-full touch-manipulation sm:w-auto sm:min-w-[10rem]"
            >
              Try again
            </Button>
            <Link to="/dashboard" className="w-full sm:inline-block sm:w-auto">
              <Button
                variant="outline"
                size="md"
                iconName="home"
                className="w-full touch-manipulation sm:w-auto sm:min-w-[10rem]"
              >
                Go to Dashboard
              </Button>
            </Link>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}
export default PageErrorBoundary;
