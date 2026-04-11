import React, { createContext, useContext } from "react";

import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { isWeb } from "packages/utils/platform";

type PersonalizationSectionLayoutValue = {
  /** When true, section bodies should not repeat the step title (sidebar / tabs show it). */
  hideStepHeadings: boolean;
};

const PersonalizationSectionLayoutContext =
  createContext<PersonalizationSectionLayoutValue>({
    hideStepHeadings: false,
  });

/**
 * Wraps settings / profile personalization main content so section bodies can suppress
 * duplicate H2s while keeping screen-reader headings on each card.
 */
export function PersonalizationSectionLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersonalizationSectionLayoutContext.Provider
      value={{ hideStepHeadings: true }}
    >
      {children}
    </PersonalizationSectionLayoutContext.Provider>
  );
}

/** Colocated with provider for a single import path; not a refresh boundary. */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with Provider above
export function useHidePersonalizationStepHeading(): boolean {
  return useContext(PersonalizationSectionLayoutContext).hideStepHeadings;
}

export type PersonalizationSectionPanelProps = {
  /** Anchor id for sidebar scroll (`#sectionId`). */
  sectionId: string;
  /** Visible in sidebar/tabs; rendered as the shared section heading inside the card. */
  screenReaderHeading: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * One card per settings/profile step: same border, padding, and landmark pattern everywhere.
 */
export function PersonalizationSectionPanel({
  sectionId,
  screenReaderHeading,
  children,
  className = "",
}: PersonalizationSectionPanelProps) {
  const headingId = `${sectionId}-personalization-sr-title`;
  return (
    <Box
      {...(isWeb
        ? { id: sectionId, "aria-labelledby": headingId }
        : { nativeID: sectionId, accessibilityLabel: screenReaderHeading })}
      className={className}
    >
      <Card border="light" padding="lg" hover={false} className="w-full">
        <Title
          {...(isWeb ? { id: headingId } : {})}
          as="h2"
          size="md"
          className="mb-6"
        >
          {screenReaderHeading}
        </Title>
        {children}
      </Card>
    </Box>
  );
}
