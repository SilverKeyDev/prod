import { useLocalization } from "packages/contexts";
import { AgreementStatusBadge } from "packages/features/documents/components/agreement/AgreementStatusBadge";
import type { Agreement } from "packages/features/documents/types/docusign";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";
import { formatAgreementDate } from "@/features/documents/utils/docusignHelpers";

type DocuSignWidgetRecentColumnProps = {
  recentAgreements: Agreement[];
  onSelectAgreement: (id: string) => void;
};

export function DocuSignWidgetRecentColumn({
  recentAgreements,
  onSelectAgreement,
}: DocuSignWidgetRecentColumnProps) {
  const { t } = useLocalization();

  return (
    <Box>
      <Box className="mb-3 flex items-center justify-between">
        <Title as="h3" size="sm" className="text-text-primary font-medium">
          {t("docusign.widget_section_recent", {
            defaultValue: "Recent Agreements",
          })}
        </Title>
      </Box>
      {recentAgreements.length === 0 ? (
        <Box className="border-border rounded-lg border border-dashed py-6 text-center">
          <BodyText size="sm" muted>
            {t("docusign.widget_empty_recent", {
              defaultValue: "No agreements yet",
            })}
          </BodyText>
        </Box>
      ) : (
        <Box className="space-y-2">
          {recentAgreements.map((agreement) => (
            <Box
              key={agreement.id}
              role="button"
              tabIndex={0}
              className="border-border bg-background-surface hover:border-border-card-strong focus-visible:ring-primary w-full cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              onClick={() => onSelectAgreement(agreement.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectAgreement(agreement.id);
                }
              }}
            >
              <Box className="flex flex-row items-stretch">
                <Box className="bg-accent w-1.5" />
                <Box className="flex flex-1 flex-row items-start gap-3 p-3 sm:p-4">
                  <Box className="border-border-card-subtle bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                    <Icon name="file-text" size={18} className="text-primary" />
                  </Box>
                  <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Box className="flex items-start justify-between gap-2">
                      <BodyText
                        as="p"
                        size="sm"
                        className="text-text-primary font-semibold leading-snug"
                      >
                        {agreement.title}
                      </BodyText>
                      <AgreementStatusBadge status={agreement.status} size="sm" showIcon={false} />
                    </Box>
                    {agreement.buyer_name ? (
                      <BodyText as="p" size="xs" muted>
                        {agreement.buyer_name}
                      </BodyText>
                    ) : null}
                    <BodyText as="p" size="xs" muted className="leading-relaxed">
                      {formatAgreementDate(agreement.updated_at || agreement.created_at)}
                    </BodyText>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
