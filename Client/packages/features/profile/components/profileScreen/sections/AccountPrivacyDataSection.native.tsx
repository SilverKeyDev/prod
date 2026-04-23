import React from "react";

import { STATIC_LEGAL_CONTACT } from "packages/features/homeauth/utils/staticLegalContact";
import {
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SECTION_TITLES } from "packages/features/profile/utils";
import { Box, Text } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { Linking } from "react-native";

import { BodyText } from "@/components/ui";

import type { AccountPrivacyDataSectionProps } from "./accountPrivacyDataSection.types";

export function AccountPrivacyDataSection({ agentSubject = null }: AccountPrivacyDataSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  if (agentSubject != null) {
    return (
      <ProfileSectionBody>
        {showSectionTitle && <Title size="md">{SECTION_TITLES.PRIVACY_DATA}</Title>}
        <BodyText size="sm" muted>
          Privacy and data requests for this profile are managed from the account holder&apos;s own
          settings.
        </BodyText>
      </ProfileSectionBody>
    );
  }

  return (
    <ProfileSectionBody>
      {showSectionTitle && <Title size="md">{SECTION_TITLES.PRIVACY_DATA}</Title>}
      <Box className="gap-1">
        <BodyText size="sm" className="text-text-secondary">
          To download a copy of your data or delete your account, use SilverKey in a web browser
          (Settings → Privacy &amp; data) or email
        </BodyText>
        <Text
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(`mailto:${STATIC_LEGAL_CONTACT.privacyEmail}`);
          }}
          className="text-sm font-medium text-brand-accent underline"
        >
          {STATIC_LEGAL_CONTACT.privacyEmail}
        </Text>
      </Box>
    </ProfileSectionBody>
  );
}
