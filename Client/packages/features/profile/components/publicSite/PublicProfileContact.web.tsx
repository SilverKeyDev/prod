import { useLocalization } from "packages/contexts";
import type {
  AgentPublicProfileViewModel,
  PublicAgentProfile,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { ExternalAnchor } from "packages/ui/components/system/accessibility";

import { PublicProfileDetail } from "./PublicProfileDetails.web";
import { PublicProfileSection } from "./PublicProfileSection.web";

const CARD_CLASS =
  "border-border bg-background-surface gap-1 rounded-2xl border p-5 sm:p-6";

const SOCIAL_PILL_CLASS =
  "border-border bg-background-surface text-text-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold !break-normal !no-underline";

type PublicProfileContactProps = {
  agent: PublicAgentProfile;
  model: AgentPublicProfileViewModel;
};

/** Contact channels and social links. Renders nothing without data. */
export function PublicProfileContact({
  agent,
  model,
}: PublicProfileContactProps) {
  const { t } = useLocalization();
  if (!model.hasContact && model.socialLinks.length === 0) return null;

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.contact}
      eyebrow={t("profile.public.site.contact_eyebrow")}
      heading={t("profile.public.site.contact_heading", {
        firstName: model.firstName,
      })}
      tone="base"
    >
      <Box className="gap-6">
        {model.hasContact ? (
          <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {model.emailTrimmed ? (
              <Box className={CARD_CLASS}>
                <BodyText
                  size="xs"
                  className="text-text-secondary font-medium uppercase tracking-wide"
                >
                  {t("profile.public.email_label")}
                </BodyText>
                <ExternalAnchor href={`mailto:${model.emailTrimmed}`}>
                  {model.emailTrimmed}
                </ExternalAnchor>
              </Box>
            ) : null}
            {model.phoneRaw ? (
              <Box className={CARD_CLASS}>
                <BodyText
                  size="xs"
                  className="text-text-secondary font-medium uppercase tracking-wide"
                >
                  {t("profile.public.phone_label")}
                </BodyText>
                {model.telHref ? (
                  <ExternalAnchor href={model.telHref}>
                    {model.phoneRaw}
                  </ExternalAnchor>
                ) : (
                  <BodyText size="sm" className="text-text-primary">
                    {model.phoneRaw}
                  </BodyText>
                )}
              </Box>
            ) : null}
            {agent.mls_id?.trim() ? (
              <Box className={CARD_CLASS}>
                <PublicProfileDetail
                  label={t("profile.public.mls_id_label")}
                  value={agent.mls_id}
                />
              </Box>
            ) : null}
          </Box>
        ) : null}

        {model.socialLinks.length > 0 ? (
          <Box className="gap-3">
            <BodyText size="sm" className="text-text-secondary font-semibold">
              {t("profile.public.social_links_heading")}
            </BodyText>
            <Box className="flex flex-row flex-wrap gap-3">
              {model.socialLinks.map((link) => (
                <ExternalAnchor
                  key={link.key}
                  href={link.href}
                  className={SOCIAL_PILL_CLASS}
                  label={`${link.label}: ${link.href}`}
                >
                  {link.label}
                  <Icon name="external-link" size={14} className="shrink-0" />
                </ExternalAnchor>
              ))}
            </Box>
          </Box>
        ) : null}
      </Box>
    </PublicProfileSection>
  );
}
