/**
 * Native layout for legal/static pages. Same API as StaticPageLayout (web)
 * so shared content components can be used with either layout.
 */

import React from "react";

import { Linking, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Link, useNavigation } from "packages/navigation";
import { ScrollView } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";
import { SHADOW_OFFSET_SUBTLE } from "packages/ui/styles/shadows/shadows.native";

export type SectionProps = {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
};

export function Section({ title, children, isLast = false }: SectionProps) {
  return (
    <View style={[styles.section, isLast && styles.sectionLast]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Paragraph({
  children,
  className: _className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function List({ children }: { children: React.ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

export function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemBullet}>•</Text>
      <Text style={styles.listItemText}>{children}</Text>
    </View>
  );
}

export function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

export function EmailLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal =
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http://") ||
    href.startsWith("https://");
  const handlePress = () => {
    if (isExternal) void Linking.openURL(href);
  };
  if (isExternal) {
    return (
      <Pressable onPress={handlePress}>
        <Text style={styles.emailLink}>{children}</Text>
      </Pressable>
    );
  }
  return (
    <Link to={href}>
      <Text style={styles.emailLink}>{children}</Text>
    </Link>
  );
}

type StaticPageLayoutProps = {
  title: string;
  subtitle?: string;
  backButtonTo?: string;
  backButtonText?: string;
  children: React.ReactNode;
};

export default function StaticPageLayout({
  title,
  subtitle,
  backButtonText = "Back to home",
  children,
}: StaticPageLayoutProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{backButtonText}</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color("neutral.100"),
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color("neutral.200"),
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: color("neutral.600"),
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: color("neutral.900"),
  },
  subtitle: {
    fontSize: 14,
    color: color("neutral.600"),
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  content: {
    backgroundColor: color("neutral.50"),
    borderRadius: 12,
    padding: 16,
    shadowColor: color("neutral.900"),
    shadowOffset: SHADOW_OFFSET_SUBTLE,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionLast: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: color("neutral.900"),
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: color("neutral.700"),
    marginBottom: 8,
  },
  list: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  listItemBullet: {
    fontSize: 15,
    color: color("neutral.700"),
    marginRight: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: color("neutral.700"),
  },
  bold: {
    fontWeight: "600",
  },
  emailLink: {
    fontSize: 15,
    color: color("brand.primary"),
    textDecorationLine: "underline",
  },
});
