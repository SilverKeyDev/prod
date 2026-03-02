import React from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import StaticPageLayout, {
  Bold,
  EmailLink,
  List,
  ListItem,
  Paragraph,
  Section,
} from "packages/features/homeauth/components/core/StaticPageLayout.native";
import { Text } from "packages/ui/components/primitives/text";

import { ContactUsContent } from "./ContactUsContent";

function NativeContactInfoContainer({ children }: { children: React.ReactNode }) {
  return <View style={contactStyles.container}>{children}</View>;
}

function NativeContactInfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={contactStyles.block}>
      <Text style={contactStyles.blockLabel}>{label}</Text>
      <View style={contactStyles.blockValue}>
        {typeof value === "string" ? (
          <Text style={contactStyles.blockValueText}>{value}</Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

function NativeFAQItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <View style={contactStyles.faqItem}>
      <Text style={contactStyles.faqQuestion}>{question}</Text>
      <Text style={contactStyles.faqAnswer}>{children}</Text>
    </View>
  );
}

const contactStyles = StyleSheet.create({
  container: {
    gap: 16,
  },
  block: {
    marginBottom: 12,
  },
  blockLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.900"),
    marginBottom: 4,
  },
  blockValue: {
    marginLeft: 0,
  },
  blockValueText: {
    fontSize: 15,
    color: color("neutral.600"),
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.900"),
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: color("neutral.600"),
  },
});

export function ContactUsScreenNative() {
  return (
    <StaticPageLayout title="Contact Us" subtitle="Last updated: 8/27/2025" centered>
      <ContactUsContent
        Section={Section}
        Paragraph={Paragraph}
        List={List}
        ListItem={ListItem}
        Bold={Bold}
        EmailLink={EmailLink}
        ContactInfoContainer={NativeContactInfoContainer}
        ContactInfoBlock={NativeContactInfoBlock}
        FAQItem={NativeFAQItem}
      />
    </StaticPageLayout>
  );
}
