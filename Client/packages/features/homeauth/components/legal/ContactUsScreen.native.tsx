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
import { Icon } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

import { ContactUsContent } from "./ContactUsContent";

function ContactInfoContainer({ children }: { children: React.ReactNode }) {
  return <View style={contactStyles.container}>{children}</View>;
}

function ContactInfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmail = label === "Email";
  return (
    <View style={contactStyles.block}>
      <View style={contactStyles.blockRow}>
        <View style={contactStyles.blockIcon}>
          <Icon name={isEmail ? "mail" : "phone"} size={18} color={color("brown.DEFAULT")} />
        </View>
        <View style={contactStyles.blockContent}>
          <Text style={contactStyles.blockLabel}>{label}</Text>
          <View style={contactStyles.blockValue}>
            {typeof value === "string" ? (
              <Text style={contactStyles.blockValueText}>{value}</Text>
            ) : (
              value
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
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
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  blockIcon: {
    marginTop: 4,
    marginRight: 12,
  },
  blockContent: {
    flex: 1,
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
        ContactInfoContainer={ContactInfoContainer}
        ContactInfoBlock={ContactInfoBlock}
        FAQItem={FAQItem}
      />
    </StaticPageLayout>
  );
}
