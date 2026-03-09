/**
 * Native auth page shell: back button, title, subtitle, error, footer links.
 * Used by Login, Signup, ForgotPassword, Verification native screens.
 */

import React from "react";

import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Link, useNavigation } from "packages/navigation";
import { ScrollView } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

type AuthPageLayoutNativeProps = {
  title: string;
  subtitle?: string;
  backButtonText?: string;
  error?: string;
  children: React.ReactNode;
};

export default function AuthPageLayoutNative({
  title,
  subtitle,
  backButtonText = "Back to Home",
  error,
  children,
}: AuthPageLayoutNativeProps) {
  const navigation = useNavigation();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      /* eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform; useFeature is for product rollout, not layout */
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      /* eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard offset differs by platform */
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{backButtonText}</Text>
        </Pressable>

        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>{children}</View>

        <View style={styles.footer}>
          <Link to="/privacy">
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Link>
          <Link to="/terms">
            <Text style={styles.footerLink}>Terms of Service</Text>
          </Link>
          <Link to="/contact">
            <Text style={styles.footerLink}>Contact Us</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color("neutral.100"),
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    color: color("neutral.600"),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: color("neutral.900"),
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: color("neutral.600"),
    marginBottom: 24,
    textAlign: "center",
  },
  errorBlock: {
    backgroundColor: color("rose.50"),
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: color("rose.800"),
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color("neutral.200"),
  },
  footerLink: {
    fontSize: 14,
    color: color("neutral.600"),
  },
});
