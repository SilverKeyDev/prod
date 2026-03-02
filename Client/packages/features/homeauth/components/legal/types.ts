import type { ReactNode } from "react";

/**
 * Layout primitives for legal/static pages. Web and native each provide
 * implementations; content components use these so copy lives in one place.
 */
export type SectionComponent = (props: {
  title: string;
  children: ReactNode;
  isLast?: boolean;
}) => JSX.Element;

export type ParagraphComponent = (props: {
  children: ReactNode;
  className?: string;
}) => JSX.Element;

export type ListComponent = (props: { children: ReactNode }) => JSX.Element;

export type ListItemComponent = (props: { children: ReactNode }) => JSX.Element;

export type BoldComponent = (props: { children: ReactNode }) => JSX.Element;

export type EmailLinkComponent = (props: { href: string; children: ReactNode }) => JSX.Element;

export type LegalLayoutPrimitives = {
  Section: SectionComponent;
  Paragraph: ParagraphComponent;
  List: ListComponent;
  ListItem: ListItemComponent;
  Bold: BoldComponent;
  EmailLink: EmailLinkComponent;
};

/** For Contact Us: wrapper around contact info blocks (grid on web, flex on native). */
export type ContactInfoContainerComponent = (props: { children: ReactNode }) => JSX.Element;

/** For Contact Us: block with label + value (e.g. Email / phone number). */
export type ContactInfoBlockComponent = (props: { label: string; value: ReactNode }) => JSX.Element;

/** For Contact Us: FAQ item with question + answer. */
export type FAQItemComponent = (props: { question: string; children: ReactNode }) => JSX.Element;

export type ContactUsLayoutPrimitives = LegalLayoutPrimitives & {
  ContactInfoContainer: ContactInfoContainerComponent;
  ContactInfoBlock: ContactInfoBlockComponent;
  FAQItem: FAQItemComponent;
};
