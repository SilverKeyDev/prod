import React, { useCallback, useState } from "react";

import { Icon } from "@ui/icons";

import { authApi } from "packages/features/homeauth/api/auth";
import { userApi } from "packages/features/homeauth/api/user";
import {
  ProfileSectionBody,
  ProfileSectionCallout,
  ProfileSectionGroup,
  useShowPersonalizationSectionBodyTitle,
} from "packages/features/profile/components/layout";
import { SECTION_TITLES } from "packages/features/profile/utils";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui/toast";
import { ROUTES } from "packages/navigation";
import { useNavigation } from "packages/navigation/hooks/useNavigation";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";
import { getDocument, getWindow } from "packages/utils/core/platform";
import { STATIC_LEGAL_CONTACT } from "packages/utils/transaction/legal/staticLegalContact";

import { BodyText, Button } from "@/components/ui";

import type { AccountPrivacyDataSectionProps } from "./accountPrivacyDataSection.types";

function triggerJsonDownload(data: Record<string, unknown>, filename: string) {
  const w = getWindow();
  const doc = getDocument();
  if (!w || !doc) return;
  const blob = new w.Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = w.URL.createObjectURL(blob);
  const a = doc.createElement("a");
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
      showSuccessToast("Your account has been deleted.");
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

  const openPrivacyPolicy = useCallback(() => {
    navigateToPath(ROUTES.PRIVACY);
  }, [navigateToPath]);

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

  const ghostInlineLinkCn =
    "inline-flex !h-auto min-h-0 items-baseline !rounded-none gap-0 !border-0 !bg-transparent p-0 px-px text-xs !font-medium !text-primary underline decoration-primary/70 underline-offset-2 !shadow-none hover:!bg-transparent hover:!opacity-80 hover:!shadow-none focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 sm:text-sm";

  return (
    <ProfileSectionBody className="max-w-3xl">
      {showSectionTitle && <Title size="md">{SECTION_TITLES.PRIVACY_DATA}</Title>}

      <ProfileSectionCallout className="px-4 py-3">
        You can download a portable copy of your profile-related data, or permanently delete your
        account on this screen. Questions or other privacy requests can be sent to{" "}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rounded="none"
          contentAlign="start"
          onPress={openMailto}
          className={ghostInlineLinkCn}
        >
          {STATIC_LEGAL_CONTACT.privacyEmail}
        </Button>
        . Read our{" "}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rounded="none"
          contentAlign="start"
          onPress={openPrivacyPolicy}
          className={ghostInlineLinkCn}
        >
          Privacy Policy
        </Button>{" "}
        for detail on how we handle information.
      </ProfileSectionCallout>

      <Box className="flex flex-col gap-4">
        <ProfileSectionGroup title="Your data" titleClassName="text-text-primary font-semibold">
          <Box className="border-border bg-background-base flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-5">
            <Box className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              <Box className="bg-primary-muted text-primary shrink-0 self-start rounded-lg p-3">
                <Icon name="download" className="h-6 w-6 shrink-0" aria-hidden />
              </Box>
              <Box className="min-w-0 flex-1 space-y-1">
                <BodyText size="sm" className="text-text-primary font-semibold tracking-tight">
                  Download copy (JSON)
                </BodyText>
                <BodyText size="sm" muted className="leading-relaxed">
                  Get a structured export of profile and related records you can archive or verify.
                </BodyText>
              </Box>
            </Box>
            <Box className="flex w-full shrink-0 flex-col justify-center md:w-auto md:min-w-[9.5rem]">
              <Button
                type="button"
                variant="secondary"
                iconName="download"
                onPress={onExport}
                disabled={exporting}
                loading={exporting}
                className="w-full"
              >
                Download
              </Button>
            </Box>
          </Box>
        </ProfileSectionGroup>

        <ProfileSectionGroup title="Danger zone" titleClassName="text-text-primary font-semibold">
          <Box className="border-destructive/35 bg-background-base flex flex-col gap-4 rounded-xl border border-dashed p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-5">
            <Box className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              <Box className="bg-destructive/10 text-destructive shrink-0 self-start rounded-lg p-3">
                <Icon name="trash-2" className="h-6 w-6 shrink-0" aria-hidden />
              </Box>
              <Box className="min-w-0 flex-1 space-y-1">
                <BodyText size="sm" className="text-text-primary font-semibold tracking-tight">
                  Delete your account
                </BodyText>
                <BodyText size="sm" muted className="leading-relaxed">
                  Permanently remove your SilverKey account and stored data after confirmation. You
                  can still sign up again later with a fresh account.
                </BodyText>
              </Box>
            </Box>
            <Box className="flex w-full shrink-0 flex-col justify-center md:w-auto md:min-w-[9.5rem]">
              <Button
                type="button"
                variant="outline"
                iconName="trash-2"
                onPress={() => {
                  setConfirmOpen(true);
                }}
                className="border-destructive text-destructive hover:bg-destructive/10 w-full border-2 font-semibold"
              >
                Delete…
              </Button>
            </Box>
          </Box>
        </ProfileSectionGroup>
      </Box>

      <BaseModal
        isOpen={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        title="Permanently delete account?"
        size="sm"
        showCloseButton
      >
        <Box className="space-y-4">
          <BodyText size="sm" muted className="leading-relaxed">
            This permanently removes your SilverKey account and data associated with your user
            identity. Make sure you have exported anything you might need later.
          </BodyText>
          <BodyText size="sm" muted>
            This cannot be undone.
          </BodyText>
          <Box className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onPress={() => {
                if (!deleting) setConfirmOpen(false);
              }}
              disabled={deleting}
            >
              Keep my account
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={onConfirmDelete}
              disabled={deleting}
              loading={deleting}
              className="bg-destructive text-white hover:opacity-90"
            >
              Yes, delete my account
            </Button>
          </Box>
        </Box>
      </BaseModal>
    </ProfileSectionBody>
  );
}
