import React, { useCallback, useState } from "react";

import { authApi } from "packages/features/homeauth/api/auth";
import { userApi } from "packages/features/homeauth/api/user";
import { STATIC_LEGAL_CONTACT } from "packages/features/homeauth/utils/staticLegalContact";
import {
  ProfileSectionBody,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SECTION_TITLES } from "packages/features/profile/utils";
import { showErrorToast } from "packages/hooks/ui/toast";
import { ROUTES } from "packages/navigation";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button } from "@/components/ui";

import type { AccountPrivacyDataSectionProps } from "./accountPrivacyDataSection.types";

function triggerJsonDownload(data: Record<string, unknown>, filename: string) {
  const w = getWindow();
  if (!w?.document) return;
  const blob = new w.Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = w.URL.createObjectURL(blob);
  const a = w.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  w.URL.revokeObjectURL(url);
}

export function AccountPrivacyDataSection({ agentSubject = null }: AccountPrivacyDataSectionProps) {
  const showSectionTitle = useShowPersonalizationSectionBodyTitle();
  const { navigateToPath } = useNavigation();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onExport = useCallback(async () => {
    if (agentSubject != null) return;
    setExporting(true);
    try {
      const data = await userApi.exportUserData();
      const id =
        typeof data.user_id === "string" && data.user_id.length > 0 ? data.user_id : "silverkey";
      triggerJsonDownload(
        data as Record<string, unknown>,
        `silverkey-data-export-${id.slice(0, 8)}.json`
      );
    } catch {
      showErrorToast("Could not export your data. Try again or email your request.");
    } finally {
      setExporting(false);
    }
  }, [agentSubject]);

  const onConfirmDelete = useCallback(async () => {
    if (agentSubject != null) return;
    setDeleting(true);
    try {
      await userApi.deleteAccount();
      setConfirmOpen(false);
      await authApi.logout();
      navigateToPath(ROUTES.HOME, { replace: true });
    } catch {
      showErrorToast("Could not delete your account. Contact support if this persists.");
    } finally {
      setDeleting(false);
    }
  }, [agentSubject, navigateToPath]);

  const openMailto = useCallback(() => {
    const w = getWindow();
    if (w) w.location.href = `mailto:${STATIC_LEGAL_CONTACT.privacyEmail}`;
  }, []);

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

      <Box className="text-text-secondary text-sm leading-relaxed">
        Download a copy of the profile-related data we hold for you, or permanently delete your
        account. For other requests, contact{" "}
        <Box
          as="span"
          className="text-primary cursor-pointer font-medium underline"
          onClick={openMailto}
        >
          {STATIC_LEGAL_CONTACT.privacyEmail}
        </Box>
        . See also our{" "}
        <Box
          as="span"
          className="text-text-secondary inline cursor-pointer underline"
          onClick={() => {
            navigateToPath(ROUTES.PRIVACY);
          }}
        >
          Privacy Policy
        </Box>
        .
      </Box>

      <Box className="flex max-w-md flex-col gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onPress={onExport}
          disabled={exporting}
          loading={exporting}
        >
          Download my data (JSON)
        </Button>
        <Button
          type="button"
          variant="outline"
          onPress={() => {
            setConfirmOpen(true);
          }}
        >
          Delete my account
        </Button>
      </Box>

      <BaseModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        title="Delete your account?"
        size="sm"
        showCloseButton
      >
        <Box className="space-y-4">
          <BodyText size="sm" className="text-text-secondary">
            This permanently removes your SilverKey account and related data. This cannot be undone.
          </BodyText>
          <Button
            type="button"
            variant="primary"
            onPress={onConfirmDelete}
            disabled={deleting}
            loading={deleting}
            className="bg-error text-white hover:opacity-90"
          >
            Yes, delete my account
          </Button>
        </Box>
      </BaseModal>
    </ProfileSectionBody>
  );
}
