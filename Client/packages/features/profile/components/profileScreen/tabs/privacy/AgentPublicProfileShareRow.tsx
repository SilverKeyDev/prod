import { useCallback, useMemo } from "react";

import { Linking } from "react-native";

import { useLocalization } from "packages/contexts";
import { showErrorToast, showSuccessToast, useSecureClipboardCopy } from "packages/hooks/ui";
import { Button } from "packages/ui";
import { Box, Text } from "packages/ui/components/structure/primitives";
import Subtitle from "packages/ui/components/structure/text/Subtitle";
import Title from "packages/ui/components/structure/text/Title";
import { tryWebShareUrl } from "packages/utils/comms/share";
import { getWindow } from "packages/utils/core/platform";
import { getAgentPublicProfileAbsoluteUrl } from "packages/utils/growth/agent";

export type AgentPublicProfileShareRowProps = {
  agentId: string;
  displayName: string | null | undefined;
  /** When set (loaded from preferences or public profile), share link uses `/a/{slug}`. */
  publicProfileSlug?: string | null;
  /** `header`: page header strip (border-b). `card`: contained panel. */
  variant?: "header" | "card";
};

export function AgentPublicProfileShareRow({
  agentId,
  displayName,
  publicProfileSlug,
  variant = "header",
}: AgentPublicProfileShareRowProps) {
  const { t } = useLocalization();
  const copyToClipboard = useSecureClipboardCopy();

  const publicUrl = useMemo(
    () => getAgentPublicProfileAbsoluteUrl(agentId, displayName ?? "", publicProfileSlug),
    [agentId, displayName, publicProfileSlug]
  );

  const handleOpenLink = useCallback(() => {
    const w = getWindow();
    if (w && typeof w.open === "function") {
      w.open(publicUrl, "_blank", "noopener,noreferrer");
      return;
    }
    void Linking.openURL(publicUrl);
  }, [publicUrl]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      showSuccessToast(t("profile.agent.link_copied"));
    } else {
      showErrorToast(t("profile.agent.copy_failed"));
    }
  }, [copyToClipboard, publicUrl, t]);

  const shareDisplayName = (displayName ?? "").trim() || t("profile.public.hero_fallback_name");

  const handleShare = useCallback(async () => {
    const result = await tryWebShareUrl({
      url: publicUrl,
      title: t("profile.agent.share_sheet_title", { name: shareDisplayName }),
      text: t("profile.agent.share_sheet_text"),
    });
    if (result === "shared" || result === "aborted") {
      return;
    }
    await handleCopy();
  }, [handleCopy, publicUrl, shareDisplayName, t]);

  const copyLabel = t("profile.agent.copy_link");
  const openLinkLabel = t("profile.agent.open_link");
  const shareLabel = t("profile.agent.share");

  const urlBoxClassName =
    "border-border-card-subtle bg-primary-muted/40 min-w-0 flex-1 rounded-lg border px-3 py-2.5";

  const urlTextClassName =
    "font-mono text-sm leading-relaxed text-text-primary select-all break-all";
  const urlText = (
    <Text as="p" className={urlTextClassName}>
      {publicUrl}
    </Text>
  );

  const actionsRow = (
    <Box className="flex w-full shrink-0 flex-row flex-wrap gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
      <Button
        variant="primary"
        size="sm"
        iconName="external-link"
        onPress={handleOpenLink}
        label={openLinkLabel}
        hideTextBelow="sm"
        className="min-h-11 justify-center sm:min-w-0"
      >
        {openLinkLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        iconName="share"
        onPress={() => void handleShare()}
        label={shareLabel}
        hideTextBelow="sm"
        className="min-h-11 justify-center sm:min-w-0"
      >
        {shareLabel}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        iconName="copy"
        onPress={handleCopy}
        label={copyLabel}
        hideTextBelow="sm"
        className="min-h-11 justify-center"
      >
        {copyLabel}
      </Button>
    </Box>
  );

  if (variant === "card") {
    return (
      <Box className="border-border bg-background-surface flex flex-col gap-4 rounded-xl border p-4 sm:p-5">
        <Box className="flex flex-col gap-1">
          <Title size="sm" as="h3" className="text-text-primary font-sans">
            {t("profile.agent.public_profile_link_label")}
          </Title>
          <Subtitle size="xs" muted>
            {t("profile.agent.public_link_hint")}
          </Subtitle>
        </Box>
        <Box className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Box className={urlBoxClassName}>{urlText}</Box>
          {actionsRow}
        </Box>
      </Box>
    );
  }

  return (
    <Box className="border-border w-full border-b pb-6">
      <Box className="flex flex-col gap-3">
        <Box className="flex flex-col gap-1">
          <Title size="sm" as="h2" className="text-text-primary font-sans">
            {t("profile.agent.public_profile_link_label")}
          </Title>
          <Subtitle size="xs" muted>
            {t("profile.agent.public_link_hint")}
          </Subtitle>
        </Box>
        <Box className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <Box className={urlBoxClassName}>{urlText}</Box>
          {actionsRow}
        </Box>
      </Box>
    </Box>
  );
}
