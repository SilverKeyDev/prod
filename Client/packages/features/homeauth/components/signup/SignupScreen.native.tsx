/**
 * Native signup screen. Uses same useSignup and validation as web SignupFeature.
 */

import React, { useState } from "react";

import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import Input from "@ui/form/Input";
import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import AuthPageLayoutNative from "packages/features/homeauth/components/core/AuthPageLayout.native";
import AuthDivider from "packages/features/homeauth/components/core/Divider";
import AuthLink from "packages/features/homeauth/components/core/Link";
import { useSignup } from "packages/features/homeauth/hooks/data/useAuthActions";
import {
  getSignupPayload,
  persistSignupEmailForVerification,
} from "packages/features/homeauth/utils/signupPayload";
import { useNavigation } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import { Pressable } from "packages/ui/components/structure/primitives";
import { Text } from "packages/ui/components/structure/primitives";
import {
  PasswordValidation,
  usePasswordValidation,
} from "packages/ui/components/surfaces/feedback";

export function SignupScreenNative() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { navigate } = useNavigation();
  const { signup, isLoading, error: signupError, clearError } = useSignup();
  const { isValid: isPasswordValid, errors: passwordErrors } = usePasswordValidation(password);

  const displayError =
    signupError ?? (!isPasswordValid && password.length > 0 ? passwordErrors?.join(". ") : null);

  const handleSubmit = async () => {
    clearError();
    if (!acceptedTerms) return;
    if (!isPasswordValid) return;
    const result = await signup(getSignupPayload({ name, email, password, phone, agencyName }));
    if (result.success) {
      persistSignupEmailForVerification(email, password);
      navigate("VERIFICATION", undefined, { state: { email } });
    }
  };

  return (
    <AuthPageLayoutNative
      title="Create your account"
      subtitle="Join thousands of users making smarter property decisions"
      backButtonText="Back to Home"
      error={displayError ?? undefined}
    >
      <Box style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <Input
          value={name}
          onValueChange={setName}
          placeholder="Enter your full name"
          autoComplete="name"
          label="Full name"
        />
      </Box>
      <Box style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onValueChange={setEmail}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          label="Email"
        />
      </Box>
      <Box style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        <Input
          value={phone}
          onValueChange={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          autoComplete="tel"
          label="Phone number"
        />
      </Box>
      <Box style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onValueChange={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="new-password"
          label="Password"
        />
      </Box>

      <PasswordValidation password={password} showValidation={password.length > 0} />

      <Pressable
        onPress={() => {
          setAcceptedTerms((v) => !v);
        }}
        style={styles.termsRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedTerms }}
      >
        <Text style={styles.termsGlyph}>{acceptedTerms ? "☑" : "☐"}</Text>
        <Text style={styles.termsText}>
          I agree to the Terms and Privacy Policy. Tap to toggle, or open{" "}
          <Text onPress={() => navigate("Terms")} style={styles.termsLink}>
            Terms
          </Text>{" "}
          /{" "}
          <Text onPress={() => navigate("Privacy")} style={styles.termsLink}>
            Privacy
          </Text>{" "}
          for the full text. Google sign-in is covered by the same agreement when you continue.
        </Text>
      </Pressable>

      <Box style={styles.field}>
        <Text style={styles.label}>Agency Name (optional)</Text>
        <Input
          value={agencyName}
          onValueChange={setAgencyName}
          placeholder="Enter agency name"
          autoComplete="organization"
          label="Agency name"
        />
      </Box>

      <Pressable
        onPress={handleSubmit}
        disabled={isLoading || !isPasswordValid || !acceptedTerms}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading }}
        style={[
          styles.primaryButton,
          (isLoading || !isPasswordValid || !acceptedTerms) && styles.primaryButtonDisabled,
        ]}
      >
        {isLoading ? (
          <KeyTurnLoader message="" />
        ) : (
          <Text style={styles.primaryButtonText}>Create account</Text>
        )}
      </Pressable>

      <AuthDivider />

      <GoogleSignInButton text="Sign up with Google" disabled={!acceptedTerms} />

      <View style={styles.links}>
        <AuthLink to="/login">
          <Text style={styles.inlineLink}>Already have an account? Log in</Text>
        </AuthLink>
      </View>
    </AuthPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  termsGlyph: {
    fontSize: 18,
    lineHeight: 22,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: color("neutral.600"),
    lineHeight: 18,
  },
  termsLink: {
    color: color("brand.accent"),
    fontWeight: "600",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: color("neutral.700"),
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.50"),
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  inlineLink: {
    fontSize: 14,
    color: color("neutral.600"),
  },
});
