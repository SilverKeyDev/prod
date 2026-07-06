import React from "react";

import { Icon } from "@ui/icons";
import { Linking } from "react-native";

import { color as tokenColor } from "packages/design-tokens";
import {
  ProfileSectionBody,
  ProfileSectionCallout,
  ProfileSectionGroup,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SECTION_TITLES } from "packages/features/profile/utils";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";
import { STATIC_LEGAL_CONTACT } from "packages/utils/transaction/legal/staticLegalContact";

import { BodyText, Button } from "@/components/ui";

import type { AccountPrivacyDataSectionProps } from "./accountPrivacyDataSection.types";

export function AccountPrivacyDataSection({ agentSubject = null }: AccountPrivacyDataSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();

  if (agentSubject != null) {
    return (
      <ProfileSectionBody className="max-w-3xl">
        {showSectionTitle && <Title size="md">{SECTION_TITLES.PRIVACY_DATA}</Title>}
        <ProfileSectionCallout className="px-4 py-3">
          Privacy and data requests for this profile are managed from the account holder&apos;s own
          settings.
        </ProfileSectionCallout>
      </ProfileSectionBody>
    );
  }

  return (
    <ProfileSectionBody className="max-w-3xl">
      {showSectionTitle && <Title size="md">{SECTION_TITLES.PRIVACY_DATA}</Title>}

      <ProfileSectionCallout className="px-4 py-3">
        Use SilverKey on the web to export your data as JSON or permanently delete your account.
        Reach us anytime for privacy questions via the email below.
      </ProfileSectionCallout>

      <Box className="flex flex-col gap-4">
        <ProfileSectionGroup title="On web" titleClassName="text-text-primary font-semibold">
          <Box className="border-border bg-background-base flex flex-col gap-4 rounded-xl border p-4">
            <Box className="flex flex-row gap-3">
              <Box className="bg-primary-muted rounded-lg p-3" accessible={false}>
                <Icon name="download" className="h-6 w-6 shrink-0" color={tokenColor("primary")} />
              </Box>
              <BodyText size="sm" muted className="flex-1 leading-relaxed">
                Open Settings → Privacy &amp; data, then Download to save a structured copy of your
                information.
              </BodyText>
            </Box>
            <Box className="flex flex-row gap-3">
              <Box className="rounded-lg bg-rose-50 p-3" accessible={false}>
                <Icon
                  name="trash-2"
                  className="h-6 w-6 shrink-0"
                  color={tokenColor("destructive")}
                />
              </Box>
              <BodyText size="sm" muted className="flex-1 leading-relaxed">
                Account deletion stays on web for verification and safety—you will confirm again
                before anything is removed.
              </BodyText>
            </Box>
          </Box>
        </ProfileSectionGroup>

        <ProfileSectionGroup title="Contact" titleClassName="text-text-primary font-semibold">
          <Box className="border-border bg-background-base rounded-xl border p-4">
            <BodyText size="sm" muted className="mb-3 leading-relaxed">
              Prefer email? Send privacy questions or requests directly to our team:
            </BodyText>
            <Button
              type="button"
              variant="ghost"
              contentAlign="start"
              label={`Email ${STATIC_LEGAL_CONTACT.privacyEmail}`}
              onPress={() => {
                void Linking.openURL(`mailto:${STATIC_LEGAL_CONTACT.privacyEmail}`);
              }}
              className="text-brand-accent h-auto min-h-0 justify-start px-0 py-1 text-base font-semibold underline"
            >
              {STATIC_LEGAL_CONTACT.privacyEmail}
            </Button>
          </Box>
        </ProfileSectionGroup>
      </Box>
    </ProfileSectionBody>
  );
}
