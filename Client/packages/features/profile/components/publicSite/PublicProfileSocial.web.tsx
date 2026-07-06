import { useLocalization } from "packages/contexts";
import type { AgentPublicProfileViewModel } from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";
import { ExternalAnchor } from "packages/ui/components/system/accessibility";

import { PublicProfileSection } from "./PublicProfileSection.web";

const SOCIAL_PILL_CLASS =
  "border-border bg-background-base text-text-primary hover:border-brand-primary hover:text-brand-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold !break-normal !no-underline motion-safe:transition-colors";

type PublicProfileSocialProps = {
  model: AgentPublicProfileViewModel;
};

/** Social / external links as labeled icon pills; hidden without links. */
export function PublicProfileSocial({ model }: PublicProfileSocialProps) {
  const { t } = useLocalization();
  if (model.socialLinks.length === 0) return null;

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.social}
      eyebrow={t("profile.public.site.social_eyebrow")}
      heading={t("profile.public.social_links_heading")}
      tone="surface"
    >
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
    </PublicProfileSection>
  );
}
